<template>
  <section id="section-about" class="container">
    <div class="title">
      <h2 id="aboutTitle">{{ $t('home.about.title')}}</h2>
      <h2 id="aboutTitleStroke" class="text-stroke">{{ $t('home.about.subtitle')}}</h2>
    </div>
    <div class="content">
      <p id="aboutText" v-html="$t('home.about.description', { br: '<br>'})"></p>
      <div id="aboutImage" class="image"/>
      <Cta :href="'/cv/' + i18n.global.locale + '.pdf'" :textstroke="$t('home.about.text-stroke-cta')" :highlighted="$t('home.about.text-highlighted-cta')"/>
    </div>
  </section>
</template>

<script>
import Cta from '../components/Cta.vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { i18n } from '@/i18n'

export default {
  name: "About",
  components: {Cta},
  setup () {
    return { i18n }
  },
  mounted() {
    gsap.registerPlugin(ScrollTrigger);
    gsap.timeline({scrollTrigger:{
        trigger:"#section-intro",
        scrub: 1,
        start:"top top",
        end:"+=80%"
      }
    }).from('#aboutText', 2, { top: -150, autoAlpha: 0 }, 0)
      .from('#aboutTitle', 2, { left: -150, autoAlpha: 0 }, 0)
      .from('#aboutTitleStroke', 2, { right: -150, autoAlpha: 0 }, 0)
      .from('#aboutImage', 2, { top: document.querySelector('#aboutImage').offsetHeight, autoAlpha: 0 }, 0)
  }
}
</script>

<style scoped>
#section-about {
  position: relative;
}
.content > * {
  max-width: 600px;
  width: 35vw;
}

.content p {
  padding-top: 100px;
  text-align: justify;
  text-shadow: 0px 0px 10px var(--color-background);
}

.content .image {
  position: absolute;
  top: -3vw;
  right: 0;
  z-index: -999;
  max-width: 550px;
  height: auto;
  aspect-ratio: 3 / 4;
  background: url('/profile.png');
  background-size: cover;
}

@media (max-width: 992px) {
  .content p {
    padding-top: 20vw;
  }
  .content p,
  .content .cta {
    width: 50vw;
  }
}

@media (max-width: 768px) {
  .content .image {
    width: 50vw;
    height: auto;
    right: -17.5vw;
  }
}
@media (max-width: 576px) {
  .content .image {
    width: 50vw;
    height: auto;
    right: -17.5vw;
  }
  .content p {
    padding-top: 35vw;
  }
  .content p,
  .content .cta {
    width: 65vw;
  }
}
</style>