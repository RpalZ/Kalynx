# Domain Setup Guide for Kalyx

## Overview
This guide will help you set up a custom domain for your Kalyx sustainable health and fitness application.

## Step 1: Get Your Free Domain

### Option A: Entri Free Domain (Recommended)
1. Visit **entri.com**
2. Look for "Free Domain" promotions
3. Use promotional codes:
   - `FREEDOMAIN`
   - `NEWUSER`
   - `WELCOME`
4. Register your preferred domain (e.g., `kalyx-health.com`)

### Option B: GitHub Student Pack
If you're a student:
1. Visit **education.github.com/pack**
2. Verify student status
3. Get free .me domain from Namecheap

### Option C: Alternative Free Options
- **Freenom**: Free .tk, .ml, .ga, .cf domains
- **InfinityFree**: Free subdomain with hosting

## Step 2: Recommended Domain Names

### Professional Options:
- `kalyx.com` (ideal if available)
- `kalyx-health.com`
- `mykalyx.com`
- `kalyx-app.com`

### Health & Sustainability Focused:
- `kalyx.health`
- `kalyx.eco`
- `sustainable-kalyx.com`
- `eco-fitness-kalyx.com`

## Step 3: Connect Domain to Your App

Once you have your domain, you'll need to configure DNS settings:

### DNS Configuration:
1. **A Record**: `@` → `75.2.60.5`
2. **CNAME Record**: `www` → `your-netlify-app.netlify.app`

### In Netlify Dashboard:
1. Go to Site Settings → Domain Management
2. Click "Add custom domain"
3. Enter your domain name
4. Follow verification steps
5. SSL certificate will be automatically provisioned

## Step 4: Update App Configuration

After domain setup, update any hardcoded URLs in your app:

```typescript
// Update environment variables
EXPO_PUBLIC_APP_URL=https://your-domain.com
```

## Step 5: Test Your Setup

1. Visit your new domain
2. Check SSL certificate (should show secure)
3. Test all app functionality
4. Verify redirects work properly

## Benefits of Custom Domain

### For Users:
- Professional appearance
- Easy to remember URL
- Builds trust and credibility

### For SEO:
- Better search engine ranking
- Custom branding
- Professional email addresses

### For Development:
- Easier to share with stakeholders
- Professional portfolio piece
- Production-ready deployment

## Cost Breakdown

### Year 1: FREE
- Domain registration: $0 (with promotion)
- DNS hosting: $0 (included with registrar)
- SSL certificate: $0 (Let's Encrypt via Netlify)
- Netlify hosting: $0 (free tier)

### Year 2+:
- Domain renewal: ~$12-15/year
- All other services remain free

## Troubleshooting

### Common Issues:
1. **DNS propagation delay**: Can take 24-48 hours
2. **SSL certificate pending**: Usually resolves automatically
3. **Domain not pointing correctly**: Double-check DNS records

### Solutions:
- Use DNS checker tools to verify propagation
- Contact domain registrar support if needed
- Clear browser cache and try incognito mode

## Security Considerations

1. **Enable WHOIS privacy** to protect personal information
2. **Use strong passwords** for domain registrar account
3. **Enable 2FA** on domain registrar account
4. **Keep contact information updated**

## Next Steps

1. Choose and register your domain
2. Configure DNS settings
3. Add domain to Netlify
4. Test thoroughly
5. Update any marketing materials with new URL

Your Kalyx app will have a professional, memorable domain that reflects its focus on sustainable health and fitness!