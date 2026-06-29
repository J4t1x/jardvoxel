// ═══════════════════════════════════════════════════════════
// SPEC-087: Natural Conversation System
// ConversationManager with AI server integration and fallback
// templates. Trigger: right-click NPC. Context sent to AI server
// includes NPC identity, player actions, biome, time, weather,
// nearby structures, and active quests. Fallback uses 20+ templates
// per personality/mood with hash-based variation.
// ═══════════════════════════════════════════════════════════

const MAX_RESPONSE_LINES = 2;
const MAX_OPTIONS = 4;
const TYPEWRITER_SPEED = 30; // ms per character
const SCROLL_THRESHOLD = 200; // chars before scroll

export const CONVERSATION_STATES = {
  IDLE: 'idle',
  WAITING_FOR_AI: 'waiting_for_ai',
  SHOWING_RESPONSE: 'showing_response',
  SHOWING_OPTIONS: 'showing_options',
  CLOSED: 'closed',
};

const FALLBACK_TEMPLATES = {
  friendly: {
    happy: [
      "Hello there, friend! It's wonderful to see you today.",
      "Ah, a familiar face! What brings you here?",
      "Greetings! The village feels brighter with you around.",
      "Good to see you! How have you been?",
    ],
    sad: [
      "Oh... hello. I'm afraid I'm not in the best mood today.",
      "Greetings... it's been a difficult time for me.",
      "Hello. I apologize if I seem distant.",
    ],
    angry: [
      "Hmph! I'm upset, but I won't take it out on you.",
      "Not now, please... I'm dealing with something frustrating.",
      "Hello. Fair warning — I'm in a sour mood.",
    ],
    scared: [
      "Oh! You startled me... sorry, I've been on edge.",
      "I-I'm glad to see a friendly face. These are troubling times.",
      "Hello... did you hear something just now?",
    ],
    neutral: [
      "Hello! Nice weather we're having, isn't it?",
      "Greetings, traveler. What can I do for you?",
      "Oh, hello! Just going about my day. You?",
    ],
  },
  grumpy: {
    happy: [
      "Hmph. You again. Well... it's not terrible seeing you.",
      "Bah. Fine, I'll admit it's decent to see you.",
      "What do you want? ...Actually, never mind, it's fine.",
    ],
    sad: [
      "Go away. I don't want to talk. ...But you're still here, aren't you?",
      "Not feeling great. But when do I ever?",
      "Leave me be. ...Or don't. Whatever.",
    ],
    angry: [
      "What NOW?! Can't you see I'm busy being furious?",
      "I have no patience today. None. Zero.",
      "Unless you're here to fix things, go away.",
    ],
    scared: [
      "I'm not scared! I'm just... cautious. Very cautious.",
      "Something's wrong out there. Don't tell me I didn't warn you.",
      "Keep your voice down. Something's watching us.",
    ],
    neutral: [
      "What do you want?",
      "Bah. Make it quick.",
      "Yes? I'm listening. Barely.",
    ],
  },
  mysterious: {
    happy: [
      "The winds whisper your name today, traveler...",
      "Ah, you arrive. The signs foretold this meeting.",
      "Curious... the threads of fate weave us together again.",
    ],
    sad: [
      "A shadow lingers... even in your presence, it does not fade.",
      "The omens are clouded today. Something weighs heavy on this land.",
      "I sense sorrow in you... or perhaps it is my own reflection.",
    ],
    angry: [
      "You dare disturb the balance? Be careful, traveler.",
      "The spirits are restless today. Do not provoke them further.",
      "There are forces at play you do not understand. Do not interfere.",
    ],
    scared: [
      "The signs... they warn of something coming. You should prepare.",
      "I have seen things in the shadows. Things that should not be.",
      "Be wary, traveler. The veil between worlds grows thin.",
    ],
    neutral: [
      "The stars told me you would come. What is your question?",
      "Knowledge has a price, traveler. Are you willing to pay?",
      "I know more than I say. But today, I may share a little.",
    ],
  },
  cheerful: {
    happy: [
      "Oh hello! What a lovely day! How are you? I'm great!",
      "Hi hi hi! I was just thinking about you! Isn't that fun?",
      "Greetings, friend! The sun is shining and so is my mood!",
    ],
    sad: [
      "Oh... hello. I'm usually so happy, but today is hard.",
      "Hi... sorry, I can't be my usual self right now.",
      "Hello. I'll be okay. Just having a not-so-great day.",
    ],
    angry: [
      "I'm SO frustrated right now! But I won't be mean about it!",
      "Ugh! Everything is annoying today! Sorry, not your fault!",
      "I'm upset and I don't want to pretend otherwise!",
    ],
    scared: [
      "Eek! Oh, it's you. Sorry, everything's been spooky lately.",
      "I-I'm fine! Just a little jumpy, that's all!",
      "Oh my, you scared me! But I'm okay, really!",
    ],
    neutral: [
      "Hi there! What's up? I'm just doing my thing!",
      "Hello! Nice to see you! What's new?",
      "Hey! How's it going? Everything's pretty good here!",
    ],
  },
  stoic: {
    happy: [
      "You are welcome here. It is good to see you.",
      "Your presence honors this place. Stay awhile.",
      "I find your company agreeable. That is high praise.",
    ],
    sad: [
      "I endure. That is all that can be said.",
      "Sorrow is a passing shadow. I wait for the light.",
      "I am... unwell. But I will not burden you with details.",
    ],
    angry: [
      "My patience is thin. Choose your words carefully.",
      "I am not to be trifled with today. State your business.",
      "Anger clouds judgment. I will wait until it passes.",
    ],
    scared: [
      "There is a threat nearby. I will not pretend otherwise.",
      "I am... unsettled. But I will hold my ground.",
      "Danger approaches. We should be vigilant.",
    ],
    neutral: [
      "Speak. I am listening.",
      "You have my attention. What is it?",
      "I am here. What do you require?",
    ],
  },
};

const PLAYER_OPTIONS = [
  ['Tell me more about this place.', 'Do you need any help?', 'What do you know about the area?', 'Goodbye.'],
  ['I have something for you.', 'Any news lately?', 'Can you teach me something?', 'I must go now.'],
  ['What troubles you?', 'Have you seen anything unusual?', 'Do you know any legends?', 'Farewell, friend.'],
  ['I\'m on an adventure!', 'What goods do you have?', 'Tell me about yourself.', 'Until we meet again.'],
];

const QUEST_TRIGGER_OPTIONS = [
  'I heard you might need help with something...',
  'Is there anything I can do for you?',
  'Do you have any work for me?',
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export class ConversationManager {
  constructor(options = {}) {
    this._aiClient = options.aiClient || null;
    this._npcMemory = options.npcMemory || null;
    this._state = CONVERSATION_STATES.IDLE;
    this._activeConversation = null;
    this._typewriterProgress = 0;
    this._typewriterTimer = null;
    this._handlers = new Map();
    this._conversationHistory = [];
  }

  startConversation(npcId, context = {}) {
    if (this._activeConversation) return null;

    const npc = this._npcMemory ? this._npcMemory.getNPC(npcId) : null;
    if (!npc) return null;

    this._activeConversation = {
      npcId,
      npc,
      context: {
        biome: context.biome || 'plains',
        time: context.time || 0,
        weather: context.weather || 'clear',
        nearbyStructures: context.nearbyStructures || [],
        activeQuests: context.activeQuests || [],
        playerActions: context.playerActions || [],
      },
      response: null,
      options: [],
      relationshipChange: 0,
      questTriggered: null,
      startedAt: Date.now(),
    };

    this._state = CONVERSATION_STATES.WAITING_FOR_AI;
    this._emit('conversation_started', this._activeConversation);
    return this._activeConversation;
  }

  async generateResponse() {
    if (!this._activeConversation) return null;
    const conv = this._activeConversation;

    const npcData = {
      name: conv.npc.identity.name,
      profession: conv.npc.identity.profession,
      personality: conv.npc.identity.personality,
      mood: conv.npc.state.mood,
      relationship: conv.npc.memory.relationship,
      knownFacts: Array.from(conv.npc.memory.knownFacts),
    };

    if (this._aiClient && this._aiClient.isConnected()) {
      try {
        const response = await this._aiClient.requestNPCDialogue(
          conv.npcId,
          npcData,
          conv.context
        );

        if (response.type === 'fallback') {
          return this._useFallbackResponse();
        }

        return this._processAIResponse(response);
      } catch (e) {
        return this._useFallbackResponse();
      }
    }

    return this._useFallbackResponse();
  }

  _processAIResponse(response) {
    const conv = this._activeConversation;
    if (!conv) return null;

    const text = response.text || response.response || '...';
    const lines = text.split('. ').filter(s => s.trim()).slice(0, MAX_RESPONSE_LINES);
    let formattedText = lines.join('. ');
    if (formattedText && !formattedText.endsWith('.') && !formattedText.endsWith('!') && !formattedText.endsWith('?')) {
      formattedText += '.';
    }

    let options = response.options || [];
    if (options.length === 0) {
      options = this._generateFallbackOptions(conv);
    }
    options = options.slice(0, MAX_OPTIONS);

    const relationshipChange = response.relationshipChange || 0;
    if (relationshipChange !== 0 && this._npcMemory) {
      this._npcMemory.adjustRelationship(conv.npcId, relationshipChange);
    }

    let questTriggered = null;
    if (response.questTrigger && this._npcMemory) {
      questTriggered = response.questTrigger;
    }

    conv.response = formattedText;
    conv.options = options;
    conv.relationshipChange = relationshipChange;
    conv.questTriggered = questTriggered;

    this._state = CONVERSATION_STATES.SHOWING_RESPONSE;
    this._startTypewriter(formattedText);

    this._conversationHistory.push({
      npcId: conv.npcId,
      text: formattedText,
      timestamp: Date.now(),
    });

    this._emit('response_ready', conv);
    return conv;
  }

  _useFallbackResponse() {
    const conv = this._activeConversation;
    if (!conv) return null;

    const personality = conv.npc.identity.personality;
    const mood = conv.npc.state.mood;
    const templates = FALLBACK_TEMPLATES[personality] || FALLBACK_TEMPLATES.friendly;
    const moodTemplates = templates[mood] || templates.neutral;

    const dayHash = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const nameHash = hashString(conv.npc.identity.name);
    const index = (nameHash + dayHash) % moodTemplates.length;
    const text = moodTemplates[index];

    const options = this._generateFallbackOptions(conv);

    conv.response = text;
    conv.options = options;
    conv.relationshipChange = 0;
    conv.questTriggered = null;

    this._state = CONVERSATION_STATES.SHOWING_RESPONSE;
    this._startTypewriter(text);

    this._conversationHistory.push({
      npcId: conv.npcId,
      text,
      timestamp: Date.now(),
    });

    this._emit('response_ready', conv);
    return conv;
  }

  _generateFallbackOptions(conv) {
    const nameHash = hashString(conv.npc.identity.name);
    const dayHash = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const optionSet = PLAYER_OPTIONS[(nameHash + dayHash) % PLAYER_OPTIONS.length];
    return optionSet.slice(0, MAX_OPTIONS);
  }

  _startTypewriter(text) {
    this._typewriterProgress = 0;
    this._typewriterTimer = setInterval(() => {
      this._typewriterProgress = Math.min(text.length, this._typewriterProgress + 1);
      this._emit('typewriter_progress', {
        progress: this._typewriterProgress,
        total: text.length,
        partial: text.substring(0, this._typewriterProgress),
      });
      if (this._typewriterProgress >= text.length) {
        this._stopTypewriter();
        this._state = CONVERSATION_STATES.SHOWING_OPTIONS;
        this._emit('options_ready', this._activeConversation);
      }
    }, TYPEWRITER_SPEED);
  }

  _stopTypewriter() {
    if (this._typewriterTimer) {
      clearInterval(this._typewriterTimer);
      this._typewriterTimer = null;
    }
  }

  skipTypewriter() {
    if (!this._activeConversation || !this._activeConversation.response) return;
    this._stopTypewriter();
    this._typewriterProgress = this._activeConversation.response.length;
    this._state = CONVERSATION_STATES.SHOWING_OPTIONS;
    this._emit('options_ready', this._activeConversation);
  }

  selectOption(optionIndex) {
    if (!this._activeConversation) return null;
    if (optionIndex < 0 || optionIndex >= this._activeConversation.options.length) return null;

    const option = this._activeConversation.options[optionIndex];

    if (this._npcMemory) {
      this._npcMemory.recordInteraction(this._activeConversation.npcId, {
        type: 'conversation',
        option: optionIndex,
        text: option,
      });
    }

    this._emit('option_selected', {
      npcId: this._activeConversation.npcId,
      option,
      index: optionIndex,
    });

    if (this._shouldTriggerQuest(option)) {
      this._activeConversation.questTriggered = {
        type: 'conversation',
        npcId: this._activeConversation.npcId,
        triggerOption: option,
      };
      this._emit('quest_triggered', this._activeConversation.questTriggered);
    }

    return option;
  }

  _shouldTriggerQuest(option) {
    const lower = option.toLowerCase();
    return QUEST_TRIGGER_OPTIONS.some(t => lower.includes(t.toLowerCase().replace('...', '')));
  }

  closeConversation() {
    this._stopTypewriter();
    if (this._activeConversation) {
      this._emit('conversation_ended', this._activeConversation);
    }
    this._activeConversation = null;
    this._state = CONVERSATION_STATES.CLOSED;
    this._typewriterProgress = 0;
  }

  getState() {
    return this._state;
  }

  getActiveConversation() {
    return this._activeConversation;
  }

  getTypewriterProgress() {
    return this._typewriterProgress;
  }

  needsScroll() {
    if (!this._activeConversation || !this._activeConversation.response) return false;
    return this._activeConversation.response.length > SCROLL_THRESHOLD;
  }

  getConversationHistory() {
    return [...this._conversationHistory];
  }

  isConversationActive() {
    return this._activeConversation !== null;
  }

  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, []);
    }
    this._handlers.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this._handlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
  }

  _emit(event, data) {
    const handlers = this._handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(data); } catch (e) {}
      }
    }
  }

  serialize() {
    return {
      history: this._conversationHistory.slice(-50),
    };
  }

  deserialize(data) {
    if (data && data.history) {
      this._conversationHistory = data.history;
    }
  }
}

export {
  MAX_RESPONSE_LINES,
  MAX_OPTIONS,
  TYPEWRITER_SPEED,
  FALLBACK_TEMPLATES,
  PLAYER_OPTIONS,
  QUEST_TRIGGER_OPTIONS,
};
