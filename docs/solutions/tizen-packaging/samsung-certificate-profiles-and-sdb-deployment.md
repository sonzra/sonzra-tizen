---
title: "Samsung Certificate Profiles and SDB Wireless Deployment"
category: "tizen-packaging"
date: "2026-11-10"
tags: ["tizen", "samsung-certificate", "sdb", "docker", "author-p12", "distributor-p12"]
---

# Samsung Certificate Profiles and SDB Wireless Deployment

## Problem
1. **Physical TV Certificate Matching:** Physical Samsung Smart TVs running Tizen 7.0-9.0 reject test certificates (`tizen-distributor-signer.p12`) or mismatched developer certificates with:
   ```
   install failed[118, -11], reason: Author certificate not match :
   ```
2. **Device DUID Binding:** The distributor certificate must embed the exact physical TV Device Unique Identifier (DUID) (e.g. `JHCMR3DMY67TK`).
3. **Password & Profile XML Injection in Headless Containers:** The official Tizen Studio CLI requires a registered `profiles.xml` with encrypted/encoded passwords to sign `.wgt` files.

---

## Solution
1. **Samsung Certificate Setup:**
   - Generated author certificate (`author.p12`) and distributor certificate (`distributor.p12`) with Samsung Certificate Manager bound to TV DUID `JHCMR3DMY67TK`.
   - Stored certificates securely under `/root/SamsungCertificate/Sonzra Tizen/`.
2. **Automated Docker Packaging:**
   - Mounted certificates and build artifacts into container `georift/install-jellyfin-tizen`.
   - Injected `profiles.xml` dynamically and executed `tizen package -t wgt -s Sonzra -- /app`.
3. **Package ID Clean Slate:**
   - When a TV already has an older app installed under a different author signature, increment the application ID in `config.xml` (e.g. `Sonzra0001` or `Sonzra0002`) to prevent author signature mismatch rejections.
4. **All-in-One Deployment Script (`deploy-tv.sh`):**
   ```bash
   ./deploy-tv.sh
   ```
   Automates Vite build, Tizen package signing, SDB wireless connection, package installation, and remote application execution.
