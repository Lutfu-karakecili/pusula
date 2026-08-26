/* ===== PUSULA - JavaScript ===== */

document.addEventListener('DOMContentLoaded', function() {
    // Header scroll effect
    initHeader();
    
    // Mobile menu
    initMobileMenu();
    
    // FAQ accordion
    initFAQ();
    
    // Smooth scroll
    initSmoothScroll();
    
    // Scroll to top
    initScrollToTop();
    
    // Testimonial slider auto-scroll
    initTestimonialSlider();
    
    // Counter animation
    initCounterAnimation();
});

/* ===== HEADER ===== */
function initHeader() {
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* ===== MOBILE MENU ===== */
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
    
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', function() {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        mobileMenuClose.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        mobileMenuLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

/* ===== FAQ ACCORDION ===== */
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(function(item) {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all items
            faqItems.forEach(function(otherItem) {
                otherItem.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

/* ===== SMOOTH SCROLL ===== */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

/* ===== SCROLL TO TOP ===== */
function initScrollToTop() {
    const scrollTopBtn = document.querySelector('.scroll-top');
    
    if (scrollTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });
        
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/* ===== TESTIMONIAL SLIDER ===== */
function initTestimonialSlider() {
    const slider = document.querySelector('.testimonials-slider');
    
    if (slider) {
        let isDown = false;
        let startX;
        let scrollLeft;
        
        slider.addEventListener('mousedown', function(e) {
            isDown = true;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        
        slider.addEventListener('mouseleave', function() {
            isDown = false;
        });
        
        slider.addEventListener('mouseup', function() {
            isDown = false;
        });
        
        slider.addEventListener('mousemove', function(e) {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        });
    }
}

/* ===== COUNTER ANIMATION ===== */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observerOptions = {
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                
                if (!isNaN(target)) {
                    animateCounter(counter, target);
                }
                
                observer.unobserve(counter);
            }
        });
    }, observerOptions);
    
    counters.forEach(function(counter) {
        observer.observe(counter);
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const duration = 2000;
    const stepTime = duration / 50;
    
    const timer = setInterval(function() {
        current += increment;
        
        if (current >= target) {
            element.textContent = target.toLocaleString('tr-TR');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString('tr-TR');
        }
    }, stepTime);
}

/* ===== UTILITY FUNCTIONS ===== */

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    
    return function executedFunction() {
        const context = this;
        const args = arguments;
        
        clearTimeout(timeout);
        
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
