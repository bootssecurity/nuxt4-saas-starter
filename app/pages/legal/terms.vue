<template>
  <div class="min-h-screen bg-default">
    <div class="max-w-4xl mx-auto px-4 py-12">
      <article class="prose prose-lg dark:prose-invert max-w-none">
        <h1>Terms of Service</h1>
        <p class="text-muted"><strong>Last Updated:</strong> January 11, 2026 | <strong>Version:</strong> 1.0</p>
        
        <h2>1. Agreement to Terms</h2>
        <p>By accessing or using our service, you agree to be bound by these Terms of Service and our <NuxtLink to="/legal/privacy">Privacy Policy</NuxtLink>. If you do not agree, please do not use our service.</p>
        
        <h2>2. Description of Service</h2>
        <p>We provide a business management platform that includes:</p>
        <ul>
          <li>User authentication and account management</li>
          <li>Business registration and employee onboarding</li>
          <li>Dashboard and reporting features</li>
        </ul>
        
        <h2>3. Account Registration</h2>
        <h3>3.1 Eligibility</h3>
        <p>You must be at least 16 years old and have the legal capacity to enter into binding contracts.</p>
        
        <h3>3.2 Account Security</h3>
        <ul>
          <li>You are responsible for maintaining the confidentiality of your account</li>
          <li>You must notify us immediately of any unauthorized access</li>
          <li>We use passwordless authentication via magic links for enhanced security</li>
        </ul>
        
        <h2>4. Acceptable Use</h2>
        <p>You agree NOT to:</p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on intellectual property rights</li>
          <li>Transmit malware or harmful code</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Use the service for fraudulent purposes</li>
        </ul>
        
        <h2>5. Termination</h2>
        <h3>5.1 By You</h3>
        <p>You may delete your account at any time through <NuxtLink to="/dashboard/settings/privacy">Settings > Privacy & Data</NuxtLink>.</p>
        
        <h3>5.2 By Us</h3>
        <p>We may suspend or terminate accounts for:</p>
        <ul>
          <li>Violation of these terms</li>
          <li>Fraudulent or illegal activity</li>
          <li>Extended inactivity</li>
        </ul>
        
        <h2>6. Limitation of Liability</h2>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
        <ul>
          <li>We provide the service "AS IS" without warranties</li>
          <li>We are not liable for indirect, incidental, or consequential damages</li>
          <li>Our total liability is limited to the amount you paid us in the past 12 months</li>
        </ul>
        
        <h2>7. Changes to Terms</h2>
        <p>We may update these terms periodically. Continued use after changes constitutes acceptance. We will notify you of significant changes.</p>
        
        <h2>8. Contact</h2>
        <p>For questions about these terms, please contact us at legal@example.com</p>
        
        <p class="text-sm text-muted mt-8"><em>By using our service, you acknowledge that you have read, understood, and agree to these Terms of Service.</em></p>
      </article>
      
      <div class="mt-12 pt-8 border-t border-default">
        <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">
          Back to Home
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: 'Terms of Service'
})
</script>
