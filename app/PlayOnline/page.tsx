'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { useDisclosure } from '@heroui/modal';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, type User as FirebaseUser, } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot, setDoc, updateDoc, serverTimestamp, type Firestore, } from 'firebase/firestore';

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;

function ensureFirebase(): { app: FirebaseApp; db: Firestore } {
  if (!app) {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_APY_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
    if (!getApps().length) {
      _app = initializeApp(firebaseConfig);
    } else {
      _app = getApps()[0]!
    }
    _db = getFirestore(_app);
  }
  return { app: _app!, db: _db! }
}

interface Vec2 { x: number; y: number }
interface Bullet { id: string; pos: Vec2; vel: Vec2; owner: string; createdAt: number }
interface PlayerState {
  uid: string
  name: string
  side: 'left' | 'right'
  ready: boolean
  pos: Vec2
  lives: number
  score: number
}

interface RoomState {
  status: 'lobby' | 'countdown' | 'playing' | 'finished'
  ownerUid: string
  createdAt: any
  players: Record<string, PlayerState>
  bullets: Record<string, Bullet>
  round: number
  countDownEndsAt?: number
}

const GAME_w = 900;
const GAME_H = 700;
const SHIP_SPEED = 280;
const BULLET_SPEED = 520;
const FIRE_COOLDOW_MS = 240;
const MAX_LIVES = 3;
const TICK_WRITE_MS = 50;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function nowMs() { return Date.now() }
function uid() { return Math.random().toString(36).slice(2) }

function throttle<T extends (...args: any[]) => void>(fn: T, wait: number ) {
  let last = 0;
  let timer: any = null;
  let lastArgs: any[] | null = null;
  return (...args: any[]) => {
    const t = nowMs();
    lastArgs = args;
    const invoke = () => { last = t; timer = null; fn(...(lastArgs as any[])) }
    if (t - last >= wait) invoke()
    else if (!timer) timer = setTimeout(invoke, wait - (t - last))
  }
}


 
export default function PlayOnline(): JSX.Element {
 return (
  <Fragment>
    
  </Fragment>
 );
}