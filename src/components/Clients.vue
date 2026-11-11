<template>
    <section id="section-clients" class="container">
      <div class="title">
        <h2 id="clientsTitle">{{ $t('home.clients.title') }}</h2>
        <h2 id="clientsTitleStroke" class="text-stroke">{{ $t('home.clients.subtitle') }}</h2>
      </div>
      <div id="clientItems" class="content">
        <Carousel :items-to-show="4" snap-align="center" :wrap-around="true" class="desktop">
          <Slide v-for="(client,slug) in clients" :key="slug">
            <ClientItem
                :slug=slug
                :title=client.title
                :subtitle=client.subtitle
                :url=client.url></ClientItem>
          </Slide>
        </Carousel>
        <Carousel :items-to-show="2" :wrap-around="true" class="mobile">
          <Slide v-for="(client,slug) in clients" :key="slug">
            <ClientItem
                :slug=slug
                :title=client.title
                :subtitle=client.subtitle
                :url=client.url></ClientItem>
          </Slide>
        </Carousel>
      </div>
    </section>
  </template>

<script>
import ClientItem from '../components/ClientItem.vue'
import { Carousel, Slide } from 'vue3-carousel'
import {gsap} from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import { computed } from 'vue'
import { clients } from '@/content/portfolio'
import 'vue3-carousel/dist/carousel.css'


export default {
  name: "Clients",
  components: {
    ClientItem,
    Carousel,
    Slide
  },
  setup () {
    return {
      clients: computed(() => {
        const entries = Object.entries(clients).reverse()
        const [third] = entries.splice(2, 1)
        if (third) entries.push(third)
        return Object.fromEntries(entries)
      }),
    }
  },
  mounted() {
    gsap.registerPlugin(ScrollTrigger);
    gsap.timeline({
      scrollTrigger: {
        trigger: "#section-clients",
        scrub: 1,
        start: "top bottom",
        end: "+=100%"
      }
    }).from('#clientsTitle', 2, {left: -150, autoAlpha: 0}, 0)
      .from('#clientsTitleStroke', 2, {right: -150, autoAlpha: 0}, 0)
    
  }
}
</script>

<style scoped>
section.container {
    max-width: 950px;
    width: 65vw;
}
.carousel {
  margin-top: 10vh;
}

/* Center snap on 4 slides shows half + 3 full + half. */
@media (min-width: 769px) {
  .desktop {
    width: calc(100% * 4 / 3);
    margin-left: calc(100% / -6);
  }
}

@media (min-width: 576px) {
  .mobile {
    display: none;
  }
}
@media (max-width: 576px) {
  .desktop {
    display: none;
  }
}
@media (max-width: 768px) {
  section.container {
    max-width: none;
    width: 100%;
  }
}
</style>