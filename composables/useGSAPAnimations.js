import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export default function useGSAPAnimations() {
  // Initialize header animations
  const animateHeader = () => {
    // Animate header elements
    gsap.from(".site-title", {
      y: -50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });

    gsap.from(".nav-link", {
      y: -30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.3,
    });
  };

  // Initialize hero section animations
  const animateHero = () => {
    gsap.from(".hero-title", {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      delay: 0.5,
    });

    gsap.from(".hero-subtitle", {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      delay: 0.7,
    });

    gsap.from(".cta-button", {
      scale: 0.8,
      opacity: 0,
      duration: 1,
      ease: "elastic.out(1, 0.5)",
      delay: 0.9,
    });
  };

  // Initialize scroll animations for sections
  const initScrollAnimations = () => {
    const sections = [
      ".about-section",
      ".articles-section",
      ".projects-section",
      ".contact-section",
    ];

    sections.forEach((section) => {
      // Section title animation
      gsap.from(`${section} .section-title`, {
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      });

      // Section content animation
      gsap.from(
        `${section} .section-content, ${section} .articles-grid, ${section} .projects-grid, ${section} .contact-content`,
        {
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            toggleActions: "play none none none",
          },
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.2,
        }
      );
    });
  };

  // Initialize card animations
  const animateCards = () => {
    // Article cards staggered animation
    gsap.from(".article-card", {
      scrollTrigger: {
        trigger: ".articles-grid",
        start: "top 70%",
        toggleActions: "play none none none",
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power2.out",
    });

    // Project cards staggered animation
    gsap.from(".project-card", {
      scrollTrigger: {
        trigger: ".projects-grid",
        start: "top 70%",
        toggleActions: "play none none none",
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power2.out",
    });
  };

  // Initialize all animations
  const initAnimations = () => {
    animateHeader();
    animateHero();
    initScrollAnimations();
    animateCards();
  };

  // Clean up ScrollTrigger instances
  const cleanup = () => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  };

  return {
    initAnimations,
    cleanup,
  };
}
