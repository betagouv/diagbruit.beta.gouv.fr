import type { Schema, Struct } from '@strapi/strapi';

export interface GlobalConditions extends Struct.ComponentSchema {
  collectionName: 'components_global_conditions';
  info: {
    description: '';
    displayName: 'conditions';
    icon: 'oneToMany';
  };
  attributes: {
    isolation_gte: Schema.Attribute.Integer;
    isolation_lte: Schema.Attribute.Integer;
    score_gte: Schema.Attribute.Integer;
    score_lte: Schema.Attribute.Integer;
    source: Schema.Attribute.Enumeration<['all', 'land', 'air', 'multi']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'all'>;
  };
}

export interface GlobalLink extends Struct.ComponentSchema {
  collectionName: 'components_global_links';
  info: {
    description: '';
    displayName: 'link';
    icon: 'stack';
  };
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GlobalLocalDocumentationCodeInsee
  extends Struct.ComponentSchema {
  collectionName: 'components_global_local_documentation_code_insees';
  info: {
    description: '';
    displayName: 'LocalDocumentationCodeInsee';
    icon: 'pinMap';
  };
  attributes: {
    codeinsee: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'global.conditions': GlobalConditions;
      'global.link': GlobalLink;
      'global.local-documentation-code-insee': GlobalLocalDocumentationCodeInsee;
    }
  }
}
