import type { Schema, Struct } from '@strapi/strapi';

export interface GlobalArray extends Struct.ComponentSchema {
  collectionName: 'components_global_arrays';
  info: {
    description: '';
    displayName: 'Array';
    icon: 'apps';
  };
  attributes: {};
}

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

export interface GlobalTest extends Struct.ComponentSchema {
  collectionName: 'components_global_tests';
  info: {
    displayName: 'test';
  };
  attributes: {};
}

export interface GlobalTextArray extends Struct.ComponentSchema {
  collectionName: 'components_global_text_arrays';
  info: {
    displayName: 'text-array';
    icon: 'apps';
  };
  attributes: {
    Text: Schema.Attribute.Text;
  };
}

export interface GlobalTitleTextArray extends Struct.ComponentSchema {
  collectionName: 'components_global_title_text_arrays';
  info: {
    displayName: 'title-text-array';
    icon: 'apps';
  };
  attributes: {
    Text: Schema.Attribute.Text;
    Title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'global.array': GlobalArray;
      'global.conditions': GlobalConditions;
      'global.link': GlobalLink;
      'global.local-documentation-code-insee': GlobalLocalDocumentationCodeInsee;
      'global.test': GlobalTest;
      'global.text-array': GlobalTextArray;
      'global.title-text-array': GlobalTitleTextArray;
    }
  }
}
