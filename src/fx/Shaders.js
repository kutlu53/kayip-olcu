import Phaser from 'phaser';

// Kamera son isleme: film greni, vinyet ve bozulma (ARGE arizasi: kromatik sapma + yatay kayma).
// Yalnizca WebGL'de; Canvas modunda hic kullanilmaz (CLAUDE.md §10.6)
const FRAG = `
#define SHADER_NAME SINEMA_FX
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uZaman;
uniform float uBozulma;
uniform float uGren;
uniform float uVinyet;
varying vec2 outTexCoord;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = outTexCoord;
  if (uBozulma > 0.001) {
    float bant = floor(uv.y * 28.0);
    float adim = floor(uZaman * 14.0);
    if (hash(vec2(bant, adim)) < uBozulma * 0.45) {
      uv.x += (hash(vec2(bant, adim + 7.0)) - 0.5) * 0.09 * uBozulma;
    }
  }
  vec4 renk = texture2D(uMainSampler, uv);
  float sapma = 0.006 * uBozulma;
  if (sapma > 0.0) {
    renk.r = texture2D(uMainSampler, uv + vec2(sapma, 0.0)).r;
    renk.b = texture2D(uMainSampler, uv - vec2(sapma, 0.0)).b;
  }
  float n = hash(outTexCoord * vec2(1280.0, 720.0) + fract(uZaman) * 91.0) - 0.5;
  renk.rgb += n * uGren;
  float d = length(outTexCoord - 0.5) * 1.25;
  renk.rgb *= mix(1.0, smoothstep(0.95, 0.35, d), uVinyet);
  gl_FragColor = renk;
}
`;

export class SinemaFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({ game, name: 'SinemaFX', fragShader: FRAG });
    this.bozulma = 0;
    this.gren = 0.035;
    this.vinyet = 0.5;
  }

  onPreRender() {
    this.set1f('uZaman', (this.game.loop.time / 1000) % 1000);
    this.set1f('uBozulma', this.bozulma);
    this.set1f('uGren', this.gren);
    this.set1f('uVinyet', this.vinyet);
  }
}
