export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Site Title',
      type: 'string',
      initialValue: 'Matt Guerra Photography',
    },
    {
      name: 'description',
      title: 'Site Description',
      type: 'text',
      rows: 3,
      description: 'Used for SEO meta description.',
    },
    {
      name: 'ogImage',
      title: 'Default Social Image',
      type: 'image',
      description: 'Default image for social media shares.',
    },
    {
      name: 'heroImage',
      title: 'Homepage Hero Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'heroTagline',
      title: 'Hero Tagline',
      type: 'string',
    },
    {
      name: 'aboutTeaser',
      title: 'About Teaser',
      type: 'text',
      rows: 4,
      description: 'Short bio shown on the homepage.',
    },
    {
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
    },
    {
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        { name: 'instagram', title: 'Instagram URL', type: 'url' },
        { name: 'linkedin', title: 'LinkedIn URL', type: 'url' },
        { name: 'github', title: 'GitHub URL', type: 'url' },
      ],
    },
  ],
  preview: {
    prepare() {
      return { title: 'Site Settings' };
    },
  },
};
