<template>
  <div class="banner">
    <img id="logo" class="logo" :src="`/works/${$route.params.slug}/logo.png`" :alt="`${work['nav-label']} logo`" >
    <img class="bg" :src="`/works/${$route.params.slug}/background.jpg`" :alt="`${work['nav-label']} background`">
  </div>
  <section class="container">
    <div class="title">
      <h1 id="introTitle">{{ work.title }}</h1>
      <h1 id="introTitleStroke" class="text-stroke">{{ work.subtitle }}</h1>
    </div>
    <div class="presentation">
      <div class="info">
        <div class="year">
          <p class="info-title">{{ $t(`work-item.year`) }}</p>
          <p>{{ work.date }}</p>
        </div>
        <div class="roles">
          <p class="info-title">{{ $tc(`work-item.roles`, rolesLength) }}</p>
          <div v-for="role in work.roles">{{ $t(`work-item.role-labels.${role}`) }}</div>
        </div>
      </div>
      <div class="description" v-html="$t(`work-item.${$route.params.slug}.description`, { br: '<br>'})"></div>
      <div class="challenges">
        <h4>{{ $t(`work-item.challenges`) }}</h4>
        <p>{{ $t(`work-item.${$route.params.slug}.challenges`) }}</p>
      </div>
      <div class="solutions">
        <h4>{{ $t(`work-item.solutions`) }}</h4>
        <p>{{ $t(`work-item.${$route.params.slug}.solutions`) }}</p>
      </div>
      <Cta :href=work.url :textstroke="$t(`work-item.visit-website-stroke`)" :highlighted="$t(`work-item.visit-website-highlighted`)"></Cta>
    </div>
    <div v-for="(section, index) in work.sections" :class="`content-section ${section.direction}`">
      <div v-for="(item) in section.items" class="content" :class="item.filter == true ? 'filter' : ''">
        <div v-if="item.type == 'text'">
          <h4>{{ $t(`work-item.${$route.params.slug}.content.${index}.title`) }}</h4>
          <p>{{ $t(`work-item.${$route.params.slug}.content.${index}.text`) }}</p>
        </div>
        <img v-if="item.type == 'image'" class="gallery-thumb cursor-hover" :src="imageSrc(item)" alt="" @click="openGallery(imageSrc(item))">
        <video v-else-if="item.type == 'local-video'" :src="`/works/${$route.params.slug}${item.src}`" alt="" preload="meta" autoplay loop onclick="this.paused ? this.play() : this.pause();"></video>
        <iframe v-else-if="item.type == 'video'" :src="`/works/${$route.params.slug}${item.src}`" frameborder="0"></iframe>
      </div>
    </div>
  </section>
  <Teleport to="body">
    <div
      v-if="galleryOpen"
      class="gallery"
      role="dialog"
      aria-modal="true"
      @click.self="closeGallery"
      @touchstart.passive="onGalleryTouchStart"
      @touchend="onGalleryTouchEnd"
    >
      <button class="gallery-close cursor-hover" type="button" :aria-label="$t('work-item.gallery-close')" @click="closeGallery">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
      <button v-if="galleryImages.length > 1" class="gallery-nav prev cursor-hover" type="button" :aria-label="$t('work-item.gallery-previous')" @click="stepGallery(-1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5L8 12l6.5 7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
      <img class="gallery-image" :src="galleryImages[galleryIndex]" alt="">
      <button v-if="galleryImages.length > 1" class="gallery-nav next cursor-hover" type="button" :aria-label="$t('work-item.gallery-next')" @click="stepGallery(1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5L16 12l-6.5 7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
      <p class="gallery-count">{{ galleryIndex + 1 }} / {{ galleryImages.length }}</p>
    </div>
  </Teleport>
  <OtherWorks :key="componentKey" :slug=$route.params.slug></OtherWorks>
</template>
<script setup>
import {ref} from 'vue';

const componentKey = ref(0);

const forceRerender = () => {
  componentKey.value += 1;
};
</script>
<script>
import Cta from '../components/Cta.vue'
import OtherWorks from '../components/OtherWorks.vue'
import {gsap} from "gsap";
import {useRoute} from 'vue-router'
import { works } from '@/content/portfolio'
import {loadMouseHover} from "@/cursor";

export default {
  components: {Cta, OtherWorks},
  data() {
    return {
      work: [],
      rolesLength: null,
      galleryOpen: false,
      galleryIndex: 0,
      galleryTouchX: 0
    }
  },
  computed: {
    galleryImages() {
      if (!this.work || !this.work.sections) return []
      const slug = this.$route.params.slug
      const images = []
      for (const section of Object.values(this.work.sections)) {
        for (const item of section.items || []) {
          if (item.type === 'image' && item.src) images.push(this.imageSrc(item, slug))
        }
      }
      return images
    }
  },
  watch: {
    '$route.params.slug'() {
      this.closeGallery()
    }
  },
  mounted() {
    this.prepare()
    window.addEventListener('keydown', this.onGalleryKey)
    gsap.from('#introTitle', {left: -100, duration: 1, ease: "power3.in", autoAlpha: 0})
    gsap.from('#introTitleStroke', {right: -100, duration: 1, ease: "power3.in", autoAlpha: 0})
    gsap.from('.info', {top: 100, duration: 1.5, autoAlpha: 0})
    gsap.from('.description', {top: 200, duration: 1, autoAlpha: 0})
    gsap.from('.challenges', {top: 200, duration: 1, autoAlpha: 0})
    gsap.from('.solutions', {top: 100, duration: 2, autoAlpha: 0})
  },
  updated() {
    this.prepare()
    this.forceRerender()

    let isMobile = false;
    (function (a) {
      if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) isMobile = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    if (!isMobile)  {
      loadMouseHover()
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onGalleryKey)
    document.documentElement.style.overflow = ''
  },
  methods: {
    prepare() {
      const route = useRoute()
      this.work = works[route.params.slug]
      this.rolesLength = this.work.roles.length
    },
    imageSrc(item, slug) {
      return `/works/${slug || this.$route.params.slug}${item.src}`
    },
    openGallery(src) {
      const index = this.galleryImages.indexOf(src)
      if (index < 0) return
      this.galleryIndex = index
      this.galleryOpen = true
      document.documentElement.style.overflow = 'hidden'
    },
    closeGallery() {
      this.galleryOpen = false
      document.documentElement.style.overflow = ''
    },
    stepGallery(delta) {
      const total = this.galleryImages.length
      if (total < 2) return
      this.galleryIndex = (this.galleryIndex + delta + total) % total
    },
    onGalleryKey(event) {
      if (!this.galleryOpen) return
      if (event.key === 'Escape') this.closeGallery()
      if (event.key === 'ArrowRight') this.stepGallery(1)
      if (event.key === 'ArrowLeft') this.stepGallery(-1)
    },
    onGalleryTouchStart(event) {
      this.galleryTouchX = event.changedTouches[0].clientX
    },
    onGalleryTouchEnd(event) {
      const delta = event.changedTouches[0].clientX - this.galleryTouchX
      if (Math.abs(delta) < 40) return
      this.stepGallery(delta < 0 ? 1 : -1)
    }
  }
}
</script>

<style scoped>
.banner {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 50vh;
}

.logo {
  height: 50%;
}

.bg {
  position: absolute;
  z-index: -99;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner:after {
  content: "";
  position: absolute;
  z-index: -9;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(0deg, rgba(30, 30, 30, 0.3), rgba(30, 30, 30, 0.3)),
  linear-gradient(0deg, rgba(150, 120, 182, 0.3), rgba(150, 120, 182, 0.3));
}

.container {
  margin-top: -3vw;
}

.title {
  position: relative;
}

h1 {
  text-align: left;
  font-size: 7vw;
  line-height: 7vw;
  text-shadow: 0px 0px 10px var(--color-background);
}

h1:not(.text-stroke) {
  margin-left: 30% !important;
}

h1.text-stroke {
  margin-left: 50%;
  width: 100%;
}

h1.text-stroke:after {
  content: "";
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  left: -10%;
  width: 12%;
  height: 1px;
  background-color: #d9d9d9;
}

.presentation {
  margin-top: 50px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 50px 0px;
  grid-template-areas:
    "info info . description description description"
    ". challenges challenges . solutions solutions"
    ". cta cta cta cta cta";
}

.info {
  grid-area: info;
  display: flex;
  flex-wrap: wrap;
  place-content: start;
}

.roles,
.year {
  margin-top: 18px;
  width: 100%;
}

.info-title {
  font-weight: bold;
  font-size: 18px;
}

.description {
  text-align: justify;
}

.description {
  grid-area: description;
  text-align: justify;
}

.challenges {
  grid-area: challenges;
}

.solutions {
  grid-area: solutions;
}

.cta {
  grid-area: cta;
}

.content-section {
  display: flex;
  justify-content: center;
  gap: 10%;
  align-items: center;
  margin-top: 100px;
}

.content-section.row { flex-direction: row;}
.content-section.row-reverse { flex-direction: row-reverse;}
.content-section.column { flex-direction: column;}
.content-section.column-reverse { flex-direction: column-reverse;}
.content-section:not(.row):not(.row-reverse) { align-items: start;}
.content-section:not(.column):not(.column-reverse) { align-items: center;}
.content-section:not(.row):not(.row-reverse) .content p { padding-bottom: 3rem;}

.content-section .content {
  max-width: 100%;
}
.content-section:not(.column):not(.column-reverse) .content:nth-last-child(n + 2),
.content-section:not(.column):not(.column-reverse) .content:nth-last-child(n + 2)~* {
  max-width: 50%;
}

.content h4 {
  font-family: "Lust Slim Display";
  font-size: 48px;
  line-height: 48px;
}

.content p {
  font-size: 18px;
  line-height: 18px;
  max-width: 540px;
}

.content video,
.content img {
  position: relative;
  display: block;
  max-width: 100%;
  max-height: 90vh;
}

.content.filter:after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  height: 100%;
  width: 100%;
  z-index: 99999;
  pointer-events: none;
  background: linear-gradient(0deg, rgba(30, 30, 30, 0.3), rgba(30, 30, 30, 0.3)), linear-gradient(0deg, rgba(150, 120, 182, 0.3), rgba(150, 120, 182, 0.3));
}

.gallery-thumb {
  transition: transform .35s ease;
}

@media (hover) {
  .content:hover .gallery-thumb {
    transform: scale(1.015);
  }
}

.gallery {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8vh 9vw;
  background: #111111;
}

.gallery-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.gallery-close,
.gallery-nav {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #d9d9d9;
}

.gallery-close {
  top: 28px;
  right: 32px;
  width: 42px;
  height: 42px;
}

.gallery-close svg,
.gallery-nav svg {
  width: 28px;
  height: 28px;
}

.gallery-nav {
  top: 50%;
  width: 52px;
  height: 52px;
  transform: translateY(-50%);
  border: 1px solid rgba(217, 217, 217, 0.35);
  border-radius: 50%;
}

.gallery-nav.prev { left: 28px; }
.gallery-nav.next { right: 28px; }

.gallery-count {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 0.14em;
  font-size: 13px;
}

@media (max-width: 768px) {
  .gallery {
    padding: 10vh 4vw;
  }
  .gallery-nav.prev { left: 10px; }
  .gallery-nav.next { right: 10px; }
  .gallery-close {
    top: 16px;
    right: 12px;
  }
}

.content iframe {
  aspect-ratio: 16 / 9;
  width: 100%; /* change this to a fixed width, or create a container with a width. */
  height: 100%;
  margin: 100px 0 100px 0;
}

@media (max-width : 992px) {
  .container {
    margin-top: -4vw;
  }
  .presentation {
    grid-template-areas:
    "info info description description description description"
    ". challenges challenges . solutions solutions"
    ". cta cta cta cta cta";
  }
}
@media (max-width : 768px) {
  .container {
    margin-top: -4vw;
  }
  h1 {
    font-size: 9vw;
    line-height: 9vw;
  }

  h1:not(.text-stroke) {
    margin-left: 0 !important;
  }

  h1.text-stroke {
    margin-left: 30%;
  }
  h1.text-stroke:after {
    left: -16%;
    width: 16%;
  }

  .presentation {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto auto auto auto;
    grid-template-areas:
    "info . ."
    "info description description"
    "challenges challenges ."
    ". solutions solutions"
    ". cta cta";
  }

  .content-section {
    flex-wrap: wrap;
  }
  .content {
    max-width: 100%!important;
    width: 100%;
    margin-bottom: 50px;
  }
}

@media (max-width: 576px) {
  .presentation {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto auto auto auto;
    grid-template-areas:
    "info info info"
    "description description description"
    "challenges challenges ."
    ". solutions solutions"
    "cta cta cta";
  }

  .info {
    flex-direction: row-reverse;
  }
  .year {
    text-align: right;
  }
  .roles,
  .year {
    margin-top: 0;
    width: 50%;
  }
}

</style>