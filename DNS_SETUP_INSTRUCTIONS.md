# DNS Setup Instructions for axiasi.com SendGrid Authentication

## 🎯 **You need to add these 4 DNS records to your domain provider:**

### **Record 1: CNAME**
- **Type:** CNAME
- **Host/Name:** `em4830.axiasi.com`
- **Value:** `u53904783.wl034.sendgrid.net`
- **TTL:** 3600 (or Auto)

### **Record 2: CNAME**
- **Type:** CNAME
- **Host/Name:** `s1._domainkey.axiasi.com`
- **Value:** `s1.domainkey.u53904783.wl034.sendgrid.net`
- **TTL:** 3600 (or Auto)

### **Record 3: CNAME**
- **Type:** CNAME
- **Host/Name:** `s2._domainkey.axiasi.com`
- **Value:** `s2.domainkey.u53904783.wl034.sendgrid.net`
- **TTL:** 3600 (or Auto)

### **Record 4: TXT**
- **Type:** TXT
- **Host/Name:** `_dmarc.axiasi.com`
- **Value:** `v=DMARC1; p=none;`
- **TTL:** 3600 (or Auto)

## 🔧 **Where to add these records:**

### **If you're using Cloudflare:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your `axiasi.com` domain
3. Go to **DNS** tab
4. Click **Add record** for each of the 4 records above

### **If you're using Namecheap:**
1. Go to [Namecheap Dashboard](https://ap.www.namecheap.com/dashboard)
2. Find `axiasi.com` and click **Manage**
3. Go to **Advanced DNS** tab
4. Add each record using **Add New Record**

### **If you're using GoDaddy:**
1. Go to [GoDaddy DNS Management](https://dcc.godaddy.com/manage/dns)
2. Select `axiasi.com`
3. Add each record using **Add** button

### **If you're using Google Domains:**
1. Go to [Google Domains](https://domains.google.com)
2. Select `axiasi.com`
3. Go to **DNS** tab
4. Add each record in **Custom records**

## ⚠️ **Important Notes:**

1. **Host/Name formatting:** Some providers want just the subdomain part:
   - Instead of `em4830.axiasi.com` → use `em4830`
   - Instead of `s1._domainkey.axiasi.com` → use `s1._domainkey`
   - Instead of `_dmarc.axiasi.com` → use `_dmarc`

2. **DNS Propagation:** Changes can take 5-60 minutes to propagate

3. **After adding records:** Come back to SendGrid and check the "I've added these records" box, then click **Verify**

## 🚀 **What happens next:**

Once verified, your AXI ASI LAB will send beautiful, professional emails from `noreply@axiasi.com` with:
- ✅ Better deliverability
- ✅ Reduced spam filtering  
- ✅ Professional branding
- ✅ Domain authentication

## 📧 **Test Email Preview:**

Your verification emails will look like this:

```
From: AXI ASI LAB <noreply@axiasi.com>
Subject: Verify your AXI ASI LAB account

🧠 AXI ASI LAB
Welcome to the Future, [username]!

Your verification code is: 123456

⚠️ Security Notice: This code expires in 10 minutes.

Welcome to the consciousness expansion protocol!
Visit us at: https://axiasi.com
```

## 🆘 **Need Help?**

If you're not sure which DNS provider you're using:
1. Go to [WhatsMyDNS.net](https://www.whatsmydns.net/)
2. Enter `axiasi.com`
3. It will show you your current DNS provider

**Common DNS Providers:**
- Cloudflare
- Namecheap
- GoDaddy
- Google Domains
- AWS Route 53
- DigitalOcean