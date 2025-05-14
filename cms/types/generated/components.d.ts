import type { Schema, Struct } from '@strapi/strapi';

export interface GlobalConditions extends Struct.ComponentSchema {
  collectionName: 'components_global_conditions';
  info: {
    description: '';
    displayName: 'conditions';
    icon: 'oneToMany';
  };
  attributes: {
    score_gte: Schema.Attribute.Integer;
    score_lte: Schema.Attribute.Integer;
    source: Schema.Attribute.Enumeration<['all', 'land', 'air']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'all'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'global.conditions': GlobalConditions;
    }
  }
}
