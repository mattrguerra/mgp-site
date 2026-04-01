export default {
  name: 'pricingPackage',
  title: 'Pricing Package',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Package Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'price',
      title: 'Price',
      type: 'string',
      description: 'Display price (e.g., "$500", "Starting at $750", "Custom")',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'highlighted',
      title: 'Highlighted',
      type: 'boolean',
      description: 'Feature this package with accent styling.',
      initialValue: false,
    },
    {
      name: 'cta',
      title: 'CTA Text',
      type: 'string',
      initialValue: 'Book Now',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
    },
  ],
  preview: {
    select: {
      title: 'title',
      price: 'price',
    },
    prepare(selection: any) {
      return {
        title: selection.title,
        subtitle: selection.price,
      };
    },
  },
};
