import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteParams, RouteRecordRaw } from 'vue-router'
import Home from './pages/Home.vue'
import Work from './pages/Work.vue'
import NotFound from './pages/NotFound.vue'
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {onMouseHover} from "./cursor"

gsap.registerPlugin(ScrollTrigger)

if (typeof history !== "undefined" && "scrollRestoration" in history) {
    history.scrollRestoration = "manual"
}

export type AppRouteNames =
    | 'home'
    | 'work-item'
    | 'test'

export const routes: RouteRecordRaw[] = [
    {
        name: 'home',
        path: '/',
        component: Home,
    },
    {
        name: 'work-item',
        path: '/work/:slug',
        component: Work,
    },
    {
        name: 'not-found',
        path: '/:pathMatch(.*)*',
        component: NotFound,
    },
]
export const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

function usesInstantScroll() {
    return window.matchMedia("(max-width: 992px)").matches
}

function applyScroll(y: number) {
    const top = Math.max(0, Math.round(y))
    window.scrollTo(0, top)
    document.documentElement.scrollTop = top
    document.body.scrollTop = top
    const app = document.getElementById("app")
    if (app) app.scrollTop = top
}

function homeSectionY(refName?: String) {
    if (refName == null || refName === "intro") return 0
    const section = document.querySelector("#section-" + refName)
    if (!(section instanceof HTMLElement)) return 0
    return section.getBoundingClientRect().top + window.scrollY - window.innerHeight / 12
}

function settleScroll(refName?: String) {
    const apply = () => applyScroll(homeSectionY(refName))
    apply()
    requestAnimationFrame(() => {
        apply()
        ScrollTrigger.refresh()
    })
    window.setTimeout(() => {
        apply()
        ScrollTrigger.refresh()
    }, 80)
}

export function routerPush(name: AppRouteNames, refName?: String, params?: RouteParams, resetMouseHover = true): ReturnType<typeof router.push>  {
    const alreadyThere = router.currentRoute.value.name === name && params === undefined
    const newRoute = params !== undefined
        ? router.push({ name, params })
        : alreadyThere
            ? Promise.resolve()
            : router.push({ name })

    if (name === 'home') {
        // The previous page can be scrolled far past the hero. ScrollTriggers measure
        // that offset on mount and leave the name faded out. On a phone the animated
        // scroll then stops between the name and the line under it.
        if (!alreadyThere && usesInstantScroll()) applyScroll(0)
        newRoute.then(() => {
            if (usesInstantScroll()) {
                settleScroll(refName)
                return
            }
            gsap.to(window, {
                duration: .6,
                scrollTo: { y: Math.max(0, homeSectionY(refName)), autoKill: false },
                onComplete: () => ScrollTrigger.refresh(),
            })
        })
        return newRoute
    }
    newRoute.then(() => { applyScroll(0) })
    if (resetMouseHover) {
        onMouseHover()
    }
    return newRoute
}

