const { chromium } = require('playwright');

async function generateSession() {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-extensions',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ]
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9'
      },
      geolocation: { longitude: -122.4194, latitude: 37.7749 }, // San Francisco
      permissions: ['geolocation']
    });

    const page = await context.newPage();
    
    // Hide automation indicators
    await page.addInitScript(() => {
      // Remove webdriver property
      delete navigator.__proto__.webdriver;
      
      // Override the plugins property to mimic a real browser
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
      
      // Override the languages property
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
      
      // Mock chrome runtime
      window.chrome = {
        runtime: {}
      };
    });
    
    // Set up console logging
    page.on('console', (msg) => {
      console.log(`Browser console [${msg.type()}]:`, msg.text());
    });

    // Set up error handling
    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://frontend:80';
    console.log(`Navigating to: ${frontendUrl}`);
    
    // Navigate to the frontend
    console.log('Loading page and waiting for all resources including images...');
    await page.goto(frontendUrl, { 
      waitUntil: 'load', // Wait for the load event (includes images)
      timeout: 45000 
    });

    // Wait for all images to load
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete);
    }, { timeout: 30000 });

    console.log('Page and all images loaded successfully');
    
    // Additional wait for any lazy-loaded images and RUM tracking
    await page.waitForTimeout(3000);

    // Wait for the Middleware script to be loaded and initialized
    console.log('Waiting for Middleware RUM script to initialize...');
    
    // Check if Middleware script is loaded
    const middlewareLoaded = await page.evaluate(() => {
      return typeof window.Middleware !== 'undefined';
    });
    
    if (middlewareLoaded) {
      console.log('✅ Middleware RUM script detected');
      
      // Wait additional time for proper initialization
      await page.waitForTimeout(8000);
      
      // Verify RUM tracking is active
      const rumStatus = await page.evaluate(() => {
        if (window.Middleware && window.Middleware.track) {
          // Trigger a custom event to test tracking
          try {
            return 'Middleware tracking appears to be active';
          } catch (e) {
            return 'Middleware detected but tracking may have issues: ' + e.message;
          }
        }
        return 'Middleware tracking not detected';
      });
      console.log('RUM Status:', rumStatus);
    } else {
      console.log('⚠️ Middleware RUM script not detected');
    }

    // Count and log images on the page
    const imageCount = await page.evaluate(() => {
      return document.querySelectorAll('img').length;
    });
    console.log(`Found ${imageCount} images on the page`);

    // Simulate human-like mouse movement and give RUM time to track everything
    console.log('Simulating human browsing behavior...');
    await page.mouse.move(100, 100);
    await page.waitForTimeout(1500);
    await page.mouse.move(300, 200);
    await page.waitForTimeout(1200);
    await page.mouse.move(500, 400);
    await page.waitForTimeout(1000);

    // Take a screenshot for debugging (optional)
    await page.screenshot({ path: '/tmp/before-click.png' });

    // Look for the "Call User API" button
    const apiButton = await page.locator('button:has-text("Call User API")');
    await apiButton.waitFor({ state: 'visible', timeout: 10000 });
    
    console.log('Found "Call User API" button');

    // Set up dialog handler for the alert
    page.on('dialog', async (dialog) => {
      console.log(`Dialog appeared: ${dialog.type()} - ${dialog.message()}`);
      await dialog.accept();
    });

    // Click the button with human-like behavior
    console.log('Clicking "Call User API" button...');
    
    // Move to button and hover before clicking
    await apiButton.hover();
    await page.waitForTimeout(800);
    
    // Click with slight delay
    await apiButton.click();
    await page.waitForTimeout(1000);

    // Wait for the API call to complete and any tracking to be sent
    console.log('Waiting for API response and RUM tracking...');
    await page.waitForTimeout(10000); // Increased wait for RUM to capture interaction
    
    // Check for any network requests to Middleware
    const middlewareRequests = await page.evaluate(() => {
      // Check if any requests were made to Middleware endpoints
      return performance.getEntries()
        .filter(entry => entry.name && entry.name.includes('middleware.io'))
        .length;
    });
    console.log(`Detected ${middlewareRequests} requests to Middleware endpoints`);

    // Take another screenshot for debugging
    await page.screenshot({ path: '/tmp/after-click.png' });

    // Navigate to a few more pages to generate additional session data
    console.log('Browsing additional pages to generate more session data...');
    
    // Simulate some scrolling behavior with image loading waits
    console.log('Scrolling to reveal more content and images...');
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(3000); // Wait for images in new viewport
    
    // Wait for any new images that came into view
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete);
    }, { timeout: 10000 }).catch(() => console.log('Some images still loading, continuing...'));
    
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(3500); // More time for images to load
    
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(2500);
    
    // Visit cart page with human-like behavior
    const cartLink = await page.locator('a[href*="/cart"]');
    if (await cartLink.isVisible()) {
      console.log('Navigating to cart page...');
      await cartLink.hover();
      await page.waitForTimeout(1200);
      await cartLink.click();
      
      // Wait for cart page to load with images
      await page.waitForLoadState('load');
      await page.waitForTimeout(4000);
      
      // Wait for cart page images
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.every(img => img.complete);
      }, { timeout: 15000 }).catch(() => console.log('Cart page: Some images still loading, continuing...'));
      
      console.log('Cart page loaded with images');
      
      // Small scroll on cart page with image wait
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(3000);
    }

    // Go back to home with realistic navigation
    console.log('Navigating back to home page...');
    await page.goto(frontendUrl, { waitUntil: 'load' });
    
    // Wait for home page images to reload
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete);
    }, { timeout: 20000 }).catch(() => console.log('Home page: Some images still loading, continuing...'));
    
    await page.waitForTimeout(4000);
    
    // Random mouse movement on home page
    await page.mouse.move(400, 300);
    await page.waitForTimeout(1500);
    await page.mouse.move(600, 500);
    await page.waitForTimeout(1200);

    // Try to visit a product page if available (most important for image tracking)
    const productLinks = await page.locator('a[href*="/product/"]');
    const productCount = await productLinks.count();
    if (productCount > 0) {
      console.log(`Found ${productCount} product links, visiting first one...`);
      await productLinks.first().hover();
      await page.waitForTimeout(1500);
      await productLinks.first().click();
      
      // Wait for product page to fully load (product pages have many images)
      console.log('Loading product page and waiting for all product images...');
      await page.waitForLoadState('load');
      await page.waitForTimeout(5000); // Extended wait for product images
      
      // Wait specifically for all product images to load
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const loadedCount = images.filter(img => img.complete).length;
        console.log(`Product page: ${loadedCount}/${images.length} images loaded`);
        return images.every(img => img.complete);
      }, { timeout: 25000 }).catch(() => console.log('Product page: Some images still loading, but continuing...'));
      
      // Count product images specifically
      const productImageCount = await page.evaluate(() => {
        return document.querySelectorAll('img').length;
      });
      console.log(`Product page loaded with ${productImageCount} images`);
      
      // Scroll on product page to simulate reading and reveal more images
      console.log('Browsing product details...');
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(4000); // Wait for any lazy-loaded images
      
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(4000); // More time for images
      
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(3500);
      
      // Final check for any newly loaded images after scrolling
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.every(img => img.complete);
      }, { timeout: 15000 }).catch(() => console.log('Final product page check: Some images still loading...'));
      
      console.log('Product page browsing completed');
    }

    // Final comprehensive wait for all RUM tracking to complete
    console.log('Allowing final time for RUM script to process all interactions and images...');
    await page.waitForTimeout(10000); // Extended final wait
    
    // Final check for RUM activity and image loading
    const finalChecks = await page.evaluate(() => {
      const entries = performance.getEntries();
      const middlewareEntries = entries.filter(entry => 
        entry.name && entry.name.includes('middleware.io')
      );
      
      const allImages = Array.from(document.querySelectorAll('img'));
      const loadedImages = allImages.filter(img => img.complete);
      
      return {
        totalMiddlewareRequests: middlewareEntries.length,
        middlewareUrls: middlewareEntries.map(e => e.name).slice(0, 5),
        totalImages: allImages.length,
        loadedImages: loadedImages.length,
        imageLoadPercentage: Math.round((loadedImages.length / allImages.length) * 100)
      };
    });
    
    console.log('=== FINAL SESSION SUMMARY ===');
    console.log(`✅ Total images found: ${finalChecks.totalImages}`);
    console.log(`✅ Images loaded: ${finalChecks.loadedImages} (${finalChecks.imageLoadPercentage}%)`);
    console.log(`✅ Middleware requests: ${finalChecks.totalMiddlewareRequests}`);
    console.log('✅ Middleware request URLs:', finalChecks.middlewareUrls);
    console.log('==============================');

    console.log('🎉 Session generation completed successfully!');
    
  } catch (error) {
    console.error('Error during automation:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Main execution
async function main() {
  console.log('Starting frontend automation for Middleware session generation...');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    await generateSession();
    console.log('✅ Automation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Automation failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

main();
