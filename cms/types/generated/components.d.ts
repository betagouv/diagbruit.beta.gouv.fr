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

export interface GlobalTitleTextArray extends Struct.ComponentSchema {
  collectionName: 'components_global_title_text_arrays';
  info: {
    description: '';
    displayName: 'title-text-array';
    icon: 'apps';
  };
  attributes: {
    text: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'global.array': GlobalArray;
      'global.link': GlobalLink;
      'global.local-documentation-code-insee': GlobalLocalDocumentationCodeInsee;
      'global.title-text-array': GlobalTitleTextArray;
    }
  }
}
