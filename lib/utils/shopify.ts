import {createStorefrontApiClient} from '@shopify/storefront-api-client';

export const client = createStorefrontApiClient({
  storeDomain: 'https://j5swwu-jv.myshopify.com',
  apiVersion: '2025-04',
  publicAccessToken: 'f9c22b89953b4e1aacd79a9f03664435',
});