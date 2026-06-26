// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Weather System
// SPEC-044: Weather System (rain/snow/lightning)
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { BIOMES } from './jardvoxel-survival-engine.js';

const WEATHER = {
  CLEAR: 'clear',
  RAIN: 'rain',
  SNOW: 'snow',
  THUNDER: 'thunder',
};

export class WeatherManager {
  constructor(scene, dayNight) {
    this.scene = scene;
    this.dayNight = dayNight;
    this.currentWeather = WEATHER.CLEAR;
    this.weatherTimer = 0;
    this.nextWeatherCheck = 120; // check every 2 min
    this.minWeatherDuration = 60;
    this.maxWeatherDuration = 300;
    this.lightningTimer = 0;
    this.lightningFlash = null;
    this.particleSystem = null;
    this.maxParticles = 800;
    this.particleVelocity = null;
    this.snowBiomes = new Set([BIOMES.SNOWY_PLAINS, BIOMES.SNOWY_PEAKS, BIOMES.TAIGA]);
    this.fogBackup = null;
    this.bgBackup = null;
  }

  _getPlayerBiome(playerPos, world) {
    if (!world || !world.generator) return BIOMES.PLAINS;
    return world.generator.getBiome(Math.floor(playerPos.x), Math.floor(playerPos.z));
  }

  _pickWeather(playerPos, world) {
    const biome = this._getPlayerBiome(playerPos, world);
    const r = Math.random();
    if (this.snowBiomes.has(biome)) {
      // Snow biomes: mostly snow, occasional thunder
      if (r < 0.5) return WEATHER.SNOW;
      if (r < 0.65) return WEATHER.THUNDER;
      return WEATHER.CLEAR;
    }
    // Normal biomes: rain and thunder
    if (r < 0.4) return WEATHER.RAIN;
    if (r < 0.55) return WEATHER.THUNDER;
    return WEATHER.CLEAR;
  }

  _setWeather(weather, playerPos, world) {
    this.currentWeather = weather;
    this.weatherTimer = this.minWeatherDuration +
      Math.random() * (this.maxWeatherDuration - this.minWeatherDuration);

    // Adjust scene visuals
    if (weather === WEATHER.CLEAR) {
      this.scene.background = new THREE.Color(0x87ceeb);
      this.scene.fog = new THREE.Fog(0x87ceeb, 30, 55);
      this._clearParticles();
    } else if (weather === WEATHER.RAIN) {
      this.scene.background = new THREE.Color(0x6a7a8a);
      this.scene.fog = new THREE.Fog(0x6a7a8a, 20, 40);
      this._initRainParticles();
    } else if (weather === WEATHER.SNOW) {
      this.scene.background = new THREE.Color(0xaab0b8);
      this.scene.fog = new THREE.Fog(0xaab0b8, 25, 45);
      this._initSnowParticles();
    } else if (weather === WEATHER.THUNDER) {
      this.scene.background = new THREE.Color(0x3a3a4a);
      this.scene.fog = new THREE.Fog(0x3a3a4a, 15, 35);
      this._initRainParticles();
      this.lightningTimer = 5 + Math.random() * 10;
    }
  }

  _initRainParticles() {
    this._clearParticles();
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const velocities = new Float32Array(this.maxParticles * 3);
    for (let i = 0; i < this.maxParticles; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      velocities[i * 3] = -0.5;
      velocities[i * 3 + 1] = -20 - Math.random() * 10;
      velocities[i * 3 + 2] = 0;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleVelocity = velocities;
    const mat = new THREE.PointsMaterial({
      color: 0x8899aa,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    this.particleSystem = new THREE.Points(geo, mat);
    this.particleSystem.frustumCulled = false;
    this.scene.add(this.particleSystem);
  }

  _initSnowParticles() {
    this._clearParticles();
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const velocities = new Float32Array(this.maxParticles * 3);
    for (let i = 0; i < this.maxParticles; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = -3 - Math.random() * 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleVelocity = velocities;
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    this.particleSystem = new THREE.Points(geo, mat);
    this.particleSystem.frustumCulled = false;
    this.scene.add(this.particleSystem);
  }

  _clearParticles() {
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      this.particleSystem.geometry.dispose();
      this.particleSystem.material.dispose();
      this.particleSystem = null;
      this.particleVelocity = null;
    }
    if (this.lightningFlash) {
      this.scene.remove(this.lightningFlash);
      this.lightningFlash = null;
    }
  }

  _updateParticles(dt, playerPos) {
    if (!this.particleSystem || !this.particleVelocity) return;
    const positions = this.particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < this.maxParticles; i++) {
      positions[i * 3] += this.particleVelocity[i * 3] * dt;
      positions[i * 3 + 1] += this.particleVelocity[i * 3 + 1] * dt;
      positions[i * 3 + 2] += this.particleVelocity[i * 3 + 2] * dt;

      // Reset particle if below ground or too far
      if (positions[i * 3 + 1] < playerPos.y - 10) {
        positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = playerPos.y + 30 + Math.random() * 10;
        positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 60;
      }
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    // Follow player
    this.particleSystem.position.set(0, 0, 0);
  }

  _triggerLightning() {
    // Flash effect
    if (!this.lightningFlash) {
      this.lightningFlash = new THREE.AmbientLight(0xffffff, 2.0);
      this.scene.add(this.lightningFlash);
      setTimeout(() => {
        if (this.lightningFlash) {
          this.scene.remove(this.lightningFlash);
          this.lightningFlash = null;
        }
      }, 150);
      // Second flash
      setTimeout(() => {
        if (this.currentWeather === WEATHER.THUNDER) {
          this.lightningFlash = new THREE.AmbientLight(0xffffff, 1.5);
          this.scene.add(this.lightningFlash);
          setTimeout(() => {
            if (this.lightningFlash) {
              this.scene.remove(this.lightningFlash);
              this.lightningFlash = null;
            }
          }, 100);
        }
      }, 300);
    }
    // Schedule next lightning
    this.lightningTimer = 8 + Math.random() * 20;
  }

  update(dt, playerPos, world) {
    this.weatherTimer -= dt;
    this.nextWeatherCheck -= dt;

    // Weather transition
    if (this.weatherTimer <= 0) {
      const newWeather = this._pickWeather(playerPos, world);
      if (newWeather !== this.currentWeather) {
        this._setWeather(newWeather, playerPos, world);
      } else {
        this.weatherTimer = this.minWeatherDuration +
          Math.random() * (this.maxWeatherDuration - this.minWeatherDuration);
      }
    }

    // Update particles
    this._updateParticles(dt, playerPos);

    // Lightning during thunder
    if (this.currentWeather === WEATHER.THUNDER) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this._triggerLightning();
      }
    }
  }

  getCurrentWeather() {
    return this.currentWeather;
  }

  isRaining() {
    return this.currentWeather === WEATHER.RAIN || this.currentWeather === WEATHER.THUNDER;
  }

  isSnowing() {
    return this.currentWeather === WEATHER.SNOW;
  }

  isThundering() {
    return this.currentWeather === WEATHER.THUNDER;
  }

  serialize() {
    return {
      currentWeather: this.currentWeather,
      weatherTimer: this.weatherTimer,
    };
  }

  deserialize(data, playerPos, world) {
    if (!data) return;
    this._setWeather(data.currentWeather, playerPos, world);
    this.weatherTimer = data.weatherTimer || 60;
  }

  dispose() {
    this._clearParticles();
  }
}

export { WEATHER };
