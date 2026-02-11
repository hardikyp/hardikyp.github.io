(() => {
  const carousel = document.querySelector('[data-testimonials-carousel]');
  if (!carousel) return;

  const source = 'assets/data/testimonials.json';

  const getInitials = (name = '') =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

  const renderCard = (item) => {
    const name = item.name ?? '';
    const title = item.title ?? '';
    const affiliation = item.affiliation ?? '';
    const quote = item.quote ?? '';
    const photoMarkup = item.photo
      ? `<img class="testimonial-card__photo" src="${item.photo}" alt="Portrait of ${name}" loading="lazy" decoding="async" />`
      : `<div class="testimonial-card__photo testimonial-card__photo--placeholder" aria-hidden="true">${getInitials(name)}</div>`;

    return `
      <article class="testimonial-card">
        <div class="testimonial-card__profile">
          ${photoMarkup}
          <div>
            <p class="testimonial-card__name">${name}</p>
            <p class="testimonial-card__meta">
              <span class="testimonial-card__title">${title}</span>
              <span class="testimonial-card__affiliation">${affiliation}</span>
            </p>
          </div>
        </div>
        <blockquote>
          <p>${quote}</p>
        </blockquote>
      </article>
    `;
  };

  const initCarousel = () => {
    const $ = window.jQuery;
    if (!$ || !$.fn || !$.fn.slick) {
      console.warn('Testimonials carousel skipped: Slick is not available.');
      return;
    }

    const $carousel = $(carousel);
    $carousel.slick({
      centerMode: true,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 1,
      centerPadding: '64px',
      arrows: false,
      dots: false,
      adaptiveHeight: true,
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 1,
            centerPadding: '80px'
          }
        },
        {
          breakpoint: 640,
          settings: {
            slidesToShow: 1,
            centerPadding: '32px'
          }
        }
      ]
    });

    const btnPrev = document.querySelector('[data-testimonials-nav="prev"]');
    const btnNext = document.querySelector('[data-testimonials-nav="next"]');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        $carousel.slick('slickPrev');
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        $carousel.slick('slickNext');
      });
    }
  };

  const loadTestimonials = async () => {
    try {
      const response = await fetch(source, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Testimonials fetch failed: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.enabled === false) {
        const section = carousel.closest('.testimonials');
        if (section) section.hidden = true;
        return;
      }
      if (!data || !Array.isArray(data.items) || data.items.length === 0) {
        carousel.innerHTML = '<p class="testimonials__fallback">Testimonials are unavailable right now.</p>';
        return;
      }

      carousel.innerHTML = data.items.map(renderCard).join('');
      initCarousel();
    } catch (error) {
      console.warn('Testimonials carousel failed to load.', error);
      carousel.innerHTML = '<p class="testimonials__fallback">Testimonials are unavailable right now.</p>';
    }
  };

  loadTestimonials();
})();
