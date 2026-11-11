<template>
  <section id="section-works" class="container">
    <div class="title">
      <h2 id="worksTitle">{{ $t('home.works.title') }}</h2>
      <h2 id="worksTitleStroke" class="text-stroke">{{ $t('home.works.subtitle') }}</h2>
    </div>
    <div id="workItems" class="content">
      <WorkItem v-for="(work,slug) in works"
          :slug=slug
          :title=work.title
          :subtitle=work.subtitle
          :tl=tlWorkItems
          @kill-animations="killAnimations"></WorkItem>
    </div>
  </section>
</template>

<script>
import WorkItem from '../components/WorkItem.vue'
import {gsap} from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import { works } from '@/content/portfolio'


export default {
  name: "Works",
  components: {WorkItem},
  data () {
    return {
      tlWorkItems: null
    }
  },
  setup () {
    return { works }
  },
  mounted() {
    gsap.registerPlugin(ScrollTrigger);
    gsap.timeline({
      scrollTrigger: {
        trigger: "#section-works",
        scrub: 1,
        start: "top bottom",
        end: "+=100%"
      }
    }).from('#worksTitle', 2, {left: -150, autoAlpha: 0}, 0)
      .from('#worksTitleStroke', 2, {right: -150, autoAlpha: 0}, 0)

     const tlWorkItems = gsap.timeline({
      scrollTrigger: {
        trigger: '#workItems',
        scrub: 1,
        start: "top bottom",
        end: "+=150%"
      }
    })

    let depth = 0.1 * document.querySelectorAll(".work-item").length;

    gsap.utils.toArray(".work-item").forEach((layer, index) => {
      depth -= 0.02;
      let movement = (layer.offsetHeight * depth)
      let moveImage = -layer.querySelector('#workItemImage').offsetHeight * depth/4
      tlWorkItems.from(layer.querySelector('#workItemImage'), {top: moveImage , autoAlpha: 1}, 0)
    })
    this.tlWorkItems = tlWorkItems
  },
  methods: {
    killAnimations() {
      this.tlWorkItems.kill()
    }
  }

}
</script>

<style scoped>
.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 60px;
  padding-bottom: 150px;
}

@media (min-width: 768px) {
  .work-item:nth-of-type(even) {
    position: relative;
    top: 150px;
  }
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
    padding-top: 50px;
  }
}
</style>