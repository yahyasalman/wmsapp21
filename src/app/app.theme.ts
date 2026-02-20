import { definePreset } from '@primeng/themes';
import Material from '@primeng/themes/material';

const makePrimary = (name: string) => ({
  50: `{${name}.50}`,
  100: `{${name}.100}`,
  200: `{${name}.200}`,
  300: `{${name}.300}`,
  400: `{${name}.400}`,
  500: `{${name}.500}`,
  600: `{${name}.600}`,
  700: `{${name}.700}`,
  800: `{${name}.800}`,
  900: `{${name}.900}`
}
);

// Base Material (no overrides)
export const MaterialPreset = definePreset(Material, {});

// Palette-specific Material presets
export const MaterialEmerald = definePreset(Material, {
  semantic: { primary: makePrimary('emerald') }
});

export const MaterialGreen = definePreset(Material, {
  semantic: {
    primary: makePrimary('green')
  }

 
});

export const MaterialLime = definePreset(Material, {
  semantic: { primary: makePrimary('lime') },
});

export const MaterialRed = definePreset(Material, {
  semantic: { primary: makePrimary('red') }
});

export const MaterialOrange = definePreset(Material, {
  semantic: { primary: makePrimary('orange') }
});

// “Silver” mapped to zinc (neutral metallic look)
export const MaterialSilver = definePreset(Material, {
  semantic: { primary: makePrimary('zinc') }
});
