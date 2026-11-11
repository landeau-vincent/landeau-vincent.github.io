<template>
  <header>
    <a class="logo" v-on:click="routerPush('home', 'intro')">
      <svg width="58" height="48" viewBox="0 0 58 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.8">
          <mask id="mask0_6_3" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="58" height="48">
            <rect y="-3.05176e-05" width="57.0667" height="48" fill="black"/>
          </mask>
          <g mask="url(#mask0_6_3)">
            <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M26.4 -3.05176e-05H-2.66666C2.69048 -3.05176e-05 7.3097 3.15935 9.4294 7.71651L14.0771 17.8666L27.8558 47.9576L34.2972 31.8912L23.2293 7.72016C22.8693 7.00202 22.6667 6.19132 22.6667 5.33331C22.6667 2.94523 24.2362 0.923733 26.4 0.244128V-3.05176e-05Z"
                  fill="#9678B6"/>
            <path
                d="M57.0399 48.0078L49.3792 31.2533L49.1572 31.3548C49.4389 33.6053 48.2531 35.8733 46.0813 36.8663C45.301 37.2231 44.4794 37.376 43.6766 37.3472L37.6128 37.3325L33.3334 48.0078H57.0399Z"
                fill="#D9D9D9"/>
            <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M32.6612 7.92715L38.656 21.0191L45.9231 2.89296C46.6115 1.55769 47.847 0.550537 49.3334 0.167989V-3.05176e-05H37.3333C34.3878 -3.05176e-05 32 2.38779 32 5.33331C32.0413 6.39117 32.2074 6.95466 32.6612 7.92715Z"
                  fill="#D9D9D9"/>
            <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M17.4892 37.3333L16.8 38.9203L16.545 39.4773C14.4803 43.7533 10.4276 46.9051 5.60001 47.7651V48H17.9983V47.9521C20.0529 47.9521 21.4148 45.8218 20.5524 43.957L17.4892 37.3333Z"
                  fill="#D9D9D9"/>
          </g>
        </g>
      </svg>
    </a>
    <div class="menu">
      <a v-for="lang in listLang" v-on:click="changeLang(lang); prepareAnimationNavigation()" class="lang-selector" :class="{ 'active': $i18n.locale === lang, 'show': showDropdown }">{{ lang }}</a>
      <a v-on:click="this.showDropdown = !this.showDropdown" class="menu-burger" :class="{'active': showDropdown}">
        <div class="hamburger hamburger-one"></div>
      </a>
    </div>
    <div class="navigation" v-on:mouseenter="toggleMenuText()" v-on:mouseleave="toggleMenuText()" :style="{ display: ($route.name === 'home') ? 'block' : 'none'}">
      <div v-for="navItem in navItems" class="nav-item">
        <a
          v-on:click.stop.prevent="routerPush('home', navItem);">
        <div class="bullet-point"
             :class="{'active': bulletPointActive === navItem}"></div>
        <span :id=navItem></span></a></div>
    </div>
    <div class="dropdown" :class="{'active': showDropdown}">
      <nav>
        <ul>
          <li v-for="navItem in navItems" class="text-stroke cursor-hover" v-on:click="routerPush('home', navItem, undefined, false); showDropdown = !showDropdown">{{ $t(`home.${navItem}.nav-label`) }}</li>
          <ul>
            <li v-for="(work, key) in works" class="text-stroke cursor-hover" v-on:click="routerPush( 'work-item', undefined, { slug: key }, false); showDropdown = !showDropdown">{{ work['nav-label'] }}</li>
          </ul>
        </ul>

      </nav>
    </div>
  </header>
</template>

<script>
import {gsap} from 'gsap';
import {TextPlugin} from "gsap/TextPlugin";
import {ScrollToPlugin} from "gsap/ScrollToPlugin";
import {routerPush} from "@/router";
import { works } from '@/content/portfolio'
import { getLanguagesAvailable, loadLanguageAsync } from '@/i18n'


export default {
  data() {
    return {
      currentLang: null,
      listLang: getLanguagesAvailable(),
      showDropdown: false,
      navTl: [],
      bulletPointActive: 'intro',
      navItems: ["intro", "about", "clients", "works"]
    }
  },
  setup(){
    return { routerPush, works }
  },
  mounted() {
    gsap.registerPlugin(ScrollToPlugin, TextPlugin);
    document.addEventListener("scroll", () => {
      if (document.querySelector(".navigation").style.display !== "none") {
        const offsetScrollY = scrollY + screen.height / 5
        document.querySelectorAll("section.container").forEach((section) => {
          let id = section.id.replace('section-', '');
          if (offsetScrollY > section.offsetTop && offsetScrollY < (section.offsetHeight + section.offsetTop) && !document.querySelector(".nav-item #" + id).previousElementSibling.classList.contains("active")) {
            this.bulletPointActive = id;
          }
        })
      }
    });
  },
  methods: {
    toggleMenuText() {
      this.navTl.forEach((tl) => {
        tl.reversed(!tl.reversed())
      })
    },
    changeLang(lang) {
      loadLanguageAsync(lang)
      this.showDropdown = false
    },
    prepareAnimationNavigation() {
      this.navTl = []
      this.navItems.forEach((slug, index) => {
        this.navTl[index] = gsap
            .to(".nav-item #" + slug, {duration: .4, text: this.$t(`home.${slug}.nav-label`)})
            .reversed(true)
      })
    },
  },
  updated() {
    if (this.currentLang !== this.$i18n.locale) {
      this.prepareAnimationNavigation()
      this.currentLang = this.$i18n.locale
    }
  }
}
</script>

<style scoped>
.logo {
  position: fixed;
  z-index: 9999;
  display: block;
  top: 50px;
  left: 50px;
}

.menu {
  position: fixed;
  z-index: 9999;
  display: flex;
  place-items: center;
  top: 50px;
  right: 50px;
}

.lang-selector,
.lang-selector.show {
  font-size: 14px;
  text-transform: uppercase;
  padding: 5px;
  transform: translateX(0px);
  opacity: 1;
  transition: opacity .4s, transform .4s;
}

.lang-selector.active {
  font-weight: bold;
}

/* Menu burger */
.menu-burger {
  margin: 8px 13px 8px 30px;
  position: relative;
  display: block;
  width: 32px;
  height: 32px;
  cursor: pointer;
}

.hamburger {
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  position: absolute;
  transition: 0.5s;
}

.hamburger:before {
  top: -15px;
}

.hamburger:after {
  top: 15px;
}

.hamburger,
.hamburger-one:before,
.hamburger-one:after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  background: #FCFCFC;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: 0.5s;
}

.menu-burger.active .hamburger-one {
  background: rgba(0, 0, 0, 0);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0);
}

.menu-burger.active .hamburger-one:before {
  top: 0;
  transform: rotate(45deg);
}

.menu-burger.active .hamburger-one:after {
  top: 0;
  transform: rotate(135deg);
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.2);
}

.navigation {
  position: fixed;
  z-index: 99;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  padding: 70px;
}

.nav-item {
  list-style: none;
  display: block;
}

.nav-item a {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  height: 39px;
}
.nav-item:not(:last-child) {
  margin-bottom: 75px;
}
.nav-item:not(:last-child):after {
  content: "";
  position: absolute;
  display: block;
  margin-left: 10px;
  width: 1px;
  height: 75px;
  background-color: #d9d9d9;
}

.bullet-point {
  width: 4px ;
  height: 4px ;
  margin-left: -2px;
  margin-right: 13px;
  border-radius: 50%;
  background-color: #d9d9d9;
  transition: all .2s ease-in-out;
}

.nav-item:hover > a > .bullet-point,
.bullet-point.active {
  width: 10px;
  height: 10px;
  margin-left: -5px;
  margin-right: 10px;
}

.dropdown::-webkit-scrollbar {
  width: 10px;
}

.dropdown {
  position: fixed;
  z-index: 999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  scrollbar-width: none;
  transform-origin: 10% 10%;
  transform: translate(-50%, -50%) rotateZ(-90deg) scale(1.5);
  background-color: #181818;
  transition: transform .4s cubic-bezier(.65, .05, .36, 1);
}

.dropdown.active {
  height: 100%;
  transform: initial;
}

.dropdown nav {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 10vh;
}

.dropdown nav ul {
  font-family: "Lust Slim Display";
  font-style: italic;
  padding: 0;
  list-style: none;
}

.dropdown > nav > ul {
  font-size: 9vw;
  line-height: 12vw;
}

.dropdown > nav > ul > ul {
  margin-left: 5vw;
  font-size: 7vw;
  line-height: 10vw;
}

@media (max-width: 992px) {
  .navigation {
    display: none!important;
  }
}
@media (max-width: 768px) {
  .logo {
    top: 20px;
    left: 20px;
  }
  .menu {
    top: 20px;
    right: 20px;
  }
  .dropdown {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .dropdown nav {
    padding-top: 0;
  }
  .dropdown nav li{
    padding: 1.5vh 0;
  }
}
@media (max-width: 576px) {
  .logo svg {
    height: 32px;
    width: auto;
  }

  .menu-burger {
    width: 24px;
    height: 24px;
    margin: 4px 13px 4px 30px;
  }
  .hamburger:before {
    top: -10px;
  }
  .hamburger:after {
    top: 10px;
  }

  .lang-selector {
    transform: translateX(50px);
    opacity: 0;
  }
}
</style>