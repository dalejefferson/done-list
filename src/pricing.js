/*
  Pricing component - Vanilla JS version
  Converts React component to vanilla JavaScript with Inter font
*/

const plans = [
  {
    name: "Starter",
    description:
      "Great for small businesses and startups looking to get started with AI",
    price: 12,
    yearlyPrice: 99,
    buttonText: "Get started",
    buttonVariant: "outline",
    features: [
      { text: "Up to 10 boards per workspace", icon: "briefcase" },
      { text: "Up to 10GB storage", icon: "database" },
      { text: "Limited analytics", icon: "server" },
    ],
    includes: [
      "Free includes:",
      "Unlimted Cards",
      "Custom background & stickers",
      "2-factor authentication",
      "Up to 2 individual users",
      "Up to 2 workspaces",
    ],
  },
  {
    name: "Business",
    description:
      "Best value for growing businesses that need more advanced features",
    price: 48,
    yearlyPrice: 399,
    buttonText: "Get started",
    buttonVariant: "default",
    popular: true,
    features: [
      { text: "Unlimted boards", icon: "briefcase" },
      { text: "Storage (250MB/file)", icon: "database" },
      { text: "100 workspace command runs", icon: "server" },
    ],
    includes: [
      "Everything in Starter, plus:",
      "Advanced checklists",
      "Custom fields",
      "Servedless functions",
      "Up to 10 individual users",
      "Up to 10 workspaces",
    ],
  },
  {
    name: "Enterprise",
    description:
      "Advanced plan with enhanced security and unlimited access for large teams",
    price: 96,
    yearlyPrice: 899,
    buttonText: "Get started",
    buttonVariant: "outline",
    features: [
      { text: "Unlimited board", icon: "briefcase" },
      { text: "Unlimited storage ", icon: "database" },
      { text: "Unlimited workspaces", icon: "server" },
    ],
    includes: [
      "Everything in Business, plus:",
      "Multi-board management",
      "Multi-board guest",
      "Attachment permissions",
      "Custom roles",
      "Custom boards",
    ],
  },
];

// Icon SVG mappings
const icons = {
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  database: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
  server: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect><rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
};

let isYearly = false;
let switchIndicator = null;

// Animate number with easing
function animateNumber(element, start, end, duration = 500) {
  const startTime = performance.now();
  const change = end - start;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + change * easeOut);
    element.textContent = current;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

function createSwitchIndicator() {
  const indicator = document.createElement('span');
  indicator.className = 'absolute top-1 h-12 rounded-xl bg-gradient-to-t from-accent-500 via-accent-500 to-accent-600';
  indicator.style.transition = 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  indicator.style.boxShadow = '0 0 0 2px rgba(74, 124, 126, 1), 0 2px 4px rgba(90, 138, 140, 0.3)';
  return indicator;
}

function updatePricingSwitch() {
  const monthlyBtn = document.getElementById('monthly-btn');
  const yearlyBtn = document.getElementById('yearly-btn');
  const switchContainer = monthlyBtn?.parentElement;
  
  if (!monthlyBtn || !yearlyBtn || !switchContainer) return;

  if (!switchIndicator) {
    switchIndicator = createSwitchIndicator();
    switchContainer.style.position = 'relative';
    switchContainer.appendChild(switchIndicator);
  }

  // Update button classes first
  if (isYearly) {
    monthlyBtn.className = 'relative z-10 w-fit cursor-pointer h-12 rounded-xl sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors sm:text-base text-sm text-base-900/70 hover:text-base-900 pricing-switch-btn';
    yearlyBtn.className = 'relative z-10 w-fit cursor-pointer h-12 flex-shrink-0 rounded-xl sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors sm:text-base text-sm text-cream-50 pricing-switch-btn';
  } else {
    monthlyBtn.className = 'relative z-10 w-fit cursor-pointer h-12 rounded-xl sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors sm:text-base text-sm text-cream-50 pricing-switch-btn';
    yearlyBtn.className = 'relative z-10 w-fit cursor-pointer h-12 flex-shrink-0 rounded-xl sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors sm:text-base text-sm text-base-900/70 hover:text-base-900 pricing-switch-btn';
  }
  
  // Wait for DOM to update, then measure and position indicator
  requestAnimationFrame(() => {
    const monthlyRect = monthlyBtn.getBoundingClientRect();
    const yearlyRect = yearlyBtn.getBoundingClientRect();
    const containerRect = switchContainer.getBoundingClientRect();
    
    // Calculate positions relative to container
    const monthlyLeft = monthlyRect.left - containerRect.left;
    const yearlyLeft = yearlyRect.left - containerRect.left;
    
    if (isYearly) {
      // Position indicator over yearly button
      switchIndicator.style.left = `${yearlyLeft}px`;
      switchIndicator.style.width = `${yearlyRect.width}px`;
    } else {
      // Position indicator over monthly button
      switchIndicator.style.left = `${monthlyLeft}px`;
      switchIndicator.style.width = `${monthlyRect.width}px`;
    }
  });
}

function renderPricingCards() {
  const container = document.getElementById('pricing-cards');
  if (!container) return;

  container.innerHTML = '';

  plans.forEach((plan) => {
    const card = document.createElement('div');
    card.className = `pricing-card relative border border-accent-500/20 rounded-xl bg-cream-50 p-6 ${
      plan.popular ? 'ring-2 ring-accent-500 bg-accent-500/10' : ''
    }`;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    const price = isYearly ? plan.yearlyPrice : plan.price;
    const period = isYearly ? 'year' : 'month';

    card.innerHTML = `
      <div class="text-left">
        <div class="flex justify-between mb-2">
          <h3 class="xl:text-3xl md:text-2xl text-3xl font-semibold text-base-900">
            ${plan.name} Plan
          </h3>
          ${plan.popular ? '<span class="flex items-center justify-center w-20 h-20 rounded-full bg-accent-500/20 border border-accent-500/40 text-accent-600 text-sm font-medium">Popular</span>' : ''}
        </div>
        <p class="xl:text-sm md:text-xs text-sm text-base-900/70 mb-4">
          ${plan.description}
        </p>
        <div class="flex items-baseline mb-6">
          <span class="text-4xl font-semibold text-base-900">$</span>
          <span class="text-4xl font-semibold text-base-900 pricing-price" data-monthly="${plan.price}" data-yearly="${plan.yearlyPrice}">${price}</span>
          <span class="text-base-900/70 ml-1">/${period}</span>
        </div>
      </div>

      <div class="pt-0">
        <button class="w-full mb-6 p-4 text-xl rounded-xl transition ${
          plan.popular
            ? 'bg-gradient-to-t from-accent-500 to-accent-600 shadow-glow border border-accent-500 text-cream-50 hover:from-accent-600 hover:to-accent-700'
            : plan.buttonVariant === 'outline'
              ? 'bg-gradient-to-t from-base-900 to-base-800 shadow-lg shadow-base-900/30 border border-base-700 text-cream-50 hover:from-base-800 hover:to-base-900'
              : 'bg-accent-500 hover:bg-accent-600 text-cream-50 shadow-glow'
        }">
          ${plan.buttonText}
        </button>

        <div class="space-y-3 pt-4 border-t border-accent-500/20">
          <h2 class="text-xl font-semibold uppercase text-base-900 mb-3">Features</h2>
          <h4 class="font-medium text-base text-base-900 mb-3">${plan.includes[0]}</h4>
          <ul class="space-y-2 font-semibold">
            ${plan.includes.slice(1).map((feature) => `
              <li class="flex items-center">
                <span class="h-6 w-6 bg-cream-50 border border-accent-500 rounded-full grid place-content-center mt-0.5 mr-3 text-accent-500">
                  ${icons.check}
                </span>
                <span class="text-sm text-base-900/70">${feature}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    container.appendChild(card);

    // Animate in
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100);
  });

  updatePrices();
}

function updatePrices() {
  const priceElements = document.querySelectorAll('.pricing-price');
  priceElements.forEach((el) => {
    const monthly = parseInt(el.dataset.monthly);
    const yearly = parseInt(el.dataset.yearly);
    const target = isYearly ? yearly : monthly;
    const current = parseInt(el.textContent) || monthly;
    animateNumber(el, current, target, 300);
  });

  // Update period text
  const periodTexts = document.querySelectorAll('.pricing-price + span');
  periodTexts.forEach((el) => {
    el.textContent = `/${isYearly ? 'year' : 'month'}`;
  });
}

function initPricing() {
  const monthlyBtn = document.getElementById('monthly-btn');
  const yearlyBtn = document.getElementById('yearly-btn');

  if (!monthlyBtn || !yearlyBtn) return;

  monthlyBtn.addEventListener('click', () => {
    if (!isYearly) return;
    isYearly = false;
    updatePricingSwitch();
    updatePrices();
  });

  yearlyBtn.addEventListener('click', () => {
    if (isYearly) return;
    isYearly = true;
    updatePricingSwitch();
    updatePrices();
  });

  // Initial render
  updatePricingSwitch();
  renderPricingCards();

  // Update indicator position on window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updatePricingSwitch();
    }, 150);
  });

  // Animate title and description on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  const title = document.querySelector('.pricing-title');
  const description = document.querySelector('.pricing-description');
  const switchContainer = document.querySelector('.pricing-switch-container');

  if (title) {
    title.style.opacity = '0';
    title.style.transform = 'translateY(-20px)';
    title.style.transition = 'opacity 0.5s ease 0s, transform 0.5s ease 0s';
    observer.observe(title);
  }

  if (description) {
    description.style.opacity = '0';
    description.style.transform = 'translateY(-20px)';
    description.style.transition = 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s';
    observer.observe(description);
  }

  if (switchContainer) {
    switchContainer.style.opacity = '0';
    switchContainer.style.transform = 'translateY(-20px)';
    switchContainer.style.transition = 'opacity 0.5s ease 0.4s, transform 0.5s ease 0.4s';
    observer.observe(switchContainer);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPricing);
} else {
  initPricing();
}

