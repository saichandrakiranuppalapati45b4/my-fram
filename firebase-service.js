/**
 * AquaFarm Command - Firebase Firestore Integration Service
 * Uses Firebase Web SDK v10 (ES Modules via Google CDN)
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDocs,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDQ6XV9scxkweVpXo8oq2DidfXd4hkqiRI",
  authDomain: "my-fram.firebaseapp.com",
  projectId: "my-fram",
  storageBucket: "my-fram.firebasestorage.app",
  messagingSenderId: "1047141115912",
  appId: "1:1047141115912:web:d7685a67f4eb6cf32e89bd",
  measurementId: "G-5WN8V5PC5R"
};

class AquaFarmFirebase {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.isConnected = false;
    this.unsubscribers = [];
    this.callbacks = {
      onPondsUpdate: null,
      onMetricsUpdate: null,
      onAlertsUpdate: null,
      onWeatherUpdate: null,
      onStatusChange: null,
      onAuthChange: null
    };
  }

  // Load config from localStorage, window, or default
  getConfig() {
    try {
      const stored = localStorage.getItem('aquafarm_firebase_config');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to parse stored firebase config", e);
    }
    return window.AQUAFARM_FIREBASE_CONFIG || DEFAULT_FIREBASE_CONFIG;
  }

  saveConfig(config) {
    if (typeof config === 'string') {
      config = JSON.parse(config);
    }
    localStorage.setItem('aquafarm_firebase_config', JSON.stringify(config));
    return this.init(config);
  }

  clearConfig() {
    localStorage.removeItem('aquafarm_firebase_config');
    this.disconnect();
  }

  async init(config = null) {
    const fbConfig = config || this.getConfig();
    if (!fbConfig || !fbConfig.projectId) {
      this.updateStatus(false, "Offline / Demo Mode");
      return false;
    }

    try {
      this.disconnect();
      this.app = getApps().length === 0 ? initializeApp(fbConfig) : getApps()[0];
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);

      // Listen to Auth State
      onAuthStateChanged(this.auth, (user) => {
        if (this.callbacks.onAuthChange) {
          this.callbacks.onAuthChange(user);
        }
      });

      this.isConnected = true;
      this.updateStatus(true, `Connected: ${fbConfig.projectId}`);
      this.attachRealtimeListeners();
      return true;
    } catch (err) {
      console.error("Firebase connection error:", err);
      this.updateStatus(false, "Connection Failed");
      return false;
    }
  }

  // Authentication Helpers
  async signUp(email, password, displayName = '') {
    if (!this.auth) await this.init();
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    if (displayName && cred.user) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch (e) {
        console.warn("Update profile error:", e);
      }
    }
    return cred.user;
  }

  async signIn(email, password) {
    if (!this.auth) await this.init();
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    return cred.user;
  }

  async signInWithGoogle() {
    if (!this.auth) await this.init();
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    return cred.user;
  }

  async signInGuest() {
    if (!this.auth) await this.init();
    const cred = await signInAnonymously(this.auth);
    return cred.user;
  }

  async logOut() {
    if (!this.auth) return;
    await signOut(this.auth);
  }

  getCurrentUser() {
    return this.auth ? this.auth.currentUser : null;
  }

  disconnect() {
    this.unsubscribers.forEach(unsub => {
      try { unsub(); } catch(e){}
    });
    this.unsubscribers = [];
    this.isConnected = false;
    this.updateStatus(false, "Disconnected");
  }

  updateStatus(connected, message) {
    this.isConnected = connected;
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange({ connected, message });
    }
  }

  // Real-time Firestore Listeners
  attachRealtimeListeners() {
    if (!this.db) return;

    // 1. Listen to Ponds Collection
    const pondsRef = collection(this.db, "ponds");
    const unsubPonds = onSnapshot(pondsRef, (snapshot) => {
      const ponds = [];
      snapshot.forEach((d) => ponds.push(d.data()));
      if (ponds.length > 0 && this.callbacks.onPondsUpdate) {
        this.callbacks.onPondsUpdate(ponds);
      }
    }, (error) => {
      console.warn("Firestore Ponds snapshot error:", error.message);
    });
    this.unsubscribers.push(unsubPonds);

    // 2. Listen to Metrics Summary
    const metricDoc = doc(this.db, "metrics", "summary");
    const unsubMetrics = onSnapshot(metricDoc, (snapshot) => {
      if (snapshot.exists() && this.callbacks.onMetricsUpdate) {
        this.callbacks.onMetricsUpdate(snapshot.data());
      }
    }, (error) => {
      console.warn("Firestore Metrics snapshot error:", error.message);
    });
    this.unsubscribers.push(unsubMetrics);

    // 3. Listen to Alerts Collection
    const alertsRef = collection(this.db, "alerts");
    const unsubAlerts = onSnapshot(alertsRef, (snapshot) => {
      const alerts = [];
      snapshot.forEach((d) => alerts.push(d.data()));
      if (alerts.length > 0 && this.callbacks.onAlertsUpdate) {
        this.callbacks.onAlertsUpdate(alerts);
      }
    }, (error) => {
      console.warn("Firestore Alerts snapshot error:", error.message);
    });
    this.unsubscribers.push(unsubAlerts);

    // 4. Listen to Weather State
    const weatherDoc = doc(this.db, "weather", "current");
    const unsubWeather = onSnapshot(weatherDoc, (snapshot) => {
      if (snapshot.exists() && this.callbacks.onWeatherUpdate) {
        this.callbacks.onWeatherUpdate(snapshot.data());
      }
    }, (error) => {
      console.warn("Firestore Weather snapshot error:", error.message);
    });
    this.unsubscribers.push(unsubWeather);
  }

  // Seed default dataset into Cloud Firestore
  async seedInitialData(initialPonds, initialAlerts) {
    if (!this.db) throw new Error("Firebase is not initialized");

    const batchPushes = [];

    // Seed Ponds
    for (const pond of initialPonds) {
      const pRef = doc(this.db, "ponds", pond.id);
      batchPushes.push(setDoc(pRef, {
        id: pond.id,
        name: pond.name || pond.id,
        species: pond.species,
        stock: pond.stock,
        temp: pond.temp,
        ph: pond.ph,
        dox: pond.dox,
        nh3: pond.nh3,
        status: pond.status,
        aeratorStatus: pond.aeratorStatus || (pond.status === 'warning' ? 'idle' : 'running'),
        area: pond.area || 'growout',
        x: pond.x || 0,
        z: pond.z || 0,
        w: pond.w || 16,
        d: pond.d || 13,
        lastUpdated: serverTimestamp()
      }, { merge: true }));
    }

    // Seed Metrics
    const metricsRef = doc(this.db, "metrics", "summary");
    batchPushes.push(setDoc(metricsRef, {
      totalFishStock: initialPonds.reduce((acc, p) => acc + (p.stock || 0), 0),
      fcr: 1.42,
      waterQualityIndex: 94.2,
      lastUpdated: serverTimestamp()
    }, { merge: true }));

    // Seed Alerts
    if (initialAlerts && initialAlerts.length > 0) {
      for (const alert of initialAlerts) {
        const aRef = doc(this.db, "alerts", alert.id);
        batchPushes.push(setDoc(aRef, {
          id: alert.id,
          pondId: alert.pondId || 'P-01',
          message: alert.message,
          severity: alert.severity || 'warning',
          resolved: false,
          timestamp: serverTimestamp()
        }, { merge: true }));
      }
    }

    // Seed Weather
    const weatherRef = doc(this.db, "weather", "current");
    batchPushes.push(setDoc(weatherRef, {
      currentWeather: 'sunny',
      isNight: false,
      updatedAt: serverTimestamp()
    }, { merge: true }));

    await Promise.all(batchPushes);
    return true;
  }

  // Update specific pond telemetry (e.g. from IoT sensor or operator click)
  async updatePondTelemetry(pondId, data) {
    if (!this.db) return;
    const pRef = doc(this.db, "ponds", pondId);
    await updateDoc(pRef, {
      ...data,
      lastUpdated: serverTimestamp()
    });
  }

  // Update farm weather
  async setWeather(currentWeather, isNight) {
    if (!this.db) return;
    const wRef = doc(this.db, "weather", "current");
    await updateDoc(wRef, {
      currentWeather,
      isNight,
      updatedAt: serverTimestamp()
    });
  }
}

export const firebaseService = new AquaFarmFirebase();
