import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, BackHandler, Dimensions, Easing, Image, KeyboardAvoidingView, PanResponder, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Switch, Text, TextInput, Linking, View, useWindowDimensions, ActivityIndicator, Vibration } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Polyline, Rect, Ellipse, Circle, G, Line, Defs, Stop } from 'react-native-svg';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoNotifications from 'expo-notifications';
import * as Device from 'expo-device';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';

import { initialState, loadState, saveState, clearState } from './src/storage';
import { Book, LocalState, Language } from './src/types';
import { copy, CopyKey } from './src/i18n';
import { fetchRemoteBooks, fetchRemoteBook, fetchRemoteCategories, fetchRemoteNotifications, trackEvent, fetchFollowedWriters, writerSignup, writerLogin, writerGoogleAuth, verifyWriterToken, fetchWriterStats, fetchWriterStories, createWriterStory, updateWriterProfile, followWriter, unfollowWriter, fetchWriterDashboard, fetchWriterNotifications, markWriterNotificationsRead, deleteWriterNotification, submitStoryForReview, updateWriterStory, deleteWriterStory, fetchWriterStoryDetail, createStoryChapter, deleteStoryChapter, fetchPublicWriters, fetchRemoteComments, submitComment, fetchCommentsConfig, toggleBookLike, fetchHomeSections, fetchUserState, saveUserState, HomeSectionsData, fetchWriterFollowers, fetchAbout, deleteWriterAccount, submitReport, userSignup, userLogin, verifyUserToken, registerPushToken, updateUserProfile, uploadWriterPdf } from './src/api';
import { pickAndResizeImage } from './src/imageUpload';
import { saveBookOffline, loadBookOffline, removeBookOffline, isBookOffline, getOfflineBookIds } from './src/offlineStorage';
import { initAllAds, showAppOpenAd, maybeShowInterstitial, showRewardedAd, isRewardedAdReady, resetAdSession } from './src/ads';

type Tab = 'home'|'library'|'categories'|'episodes'|'profile';
type Screen = { type:'main' } | { type:'book', id:string } | { type:'reader', id:string, chapter:number } | { type:'pdfReader', id:string, pdfUrl:string, title:string } | { type:'search' } | { type:'notifications' } | { type:'settings' } | { type:'writer' } | { type:'list', title:string, ids:string[] } | { type:'profileDetails' } | { type:'followedWriters' } | { type:'writerProfile', writer:import('./src/types').WriterProfile } | { type:'comments', id:string } | { type:'allWriters' } | { type:'newStory' } | { type:'newPdfStory' } | { type:'editStory', id:string, title:string, desc:string, coverUrl:string|null, writerStatus:string } | { type:'aboutApp' } | { type:'terms' } | { type:'guide' };
type Theme = {dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string};
const I = (name:string) => (Feather.glyphMap as Record<string,unknown>)[name] ? name as keyof typeof Feather.glyphMap : 'bell';

function SplashScreen({theme}:{theme:Theme}){
  const[typed,setTyped]=useState('');
  const full='লেখনী কাহিনী';
  const{height}=useWindowDimensions();
  const fadeAnim=useRef(new Animated.Value(0)).current;
  const scaleAnim=useRef(new Animated.Value(0.7)).current;
  const glowAnim=useRef(new Animated.Value(0.2)).current;
  const breathe=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.parallel([
      Animated.timing(fadeAnim,{toValue:1,duration:1000,useNativeDriver:true}),
      Animated.spring(scaleAnim,{toValue:1,friction:7,useNativeDriver:true}),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(breathe,{toValue:1,duration:2000,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
      Animated.timing(breathe,{toValue:0,duration:2000,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim,{toValue:0.5,duration:1800,useNativeDriver:true}),
      Animated.timing(glowAnim,{toValue:0.2,duration:1800,useNativeDriver:true}),
    ])).start();
    let i=0;const iv=setInterval(()=>{i++;setTyped(full.slice(0,i));if(i>=full.length)clearInterval(iv)},80);return()=>clearInterval(iv);
  },[]);
  const circleSize=Math.min(height*0.38,260);
  return <View style={{flex:1,backgroundColor:'#3B0F1C',alignItems:'center',justifyContent:'center'}}>
    <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,overflow:'hidden'}}>
      <View style={{position:'absolute',width:height*0.6,height:height*0.6,borderRadius:height*0.3,backgroundColor:'rgba(255,255,255,0.025)',top:-height*0.12,right:-height*0.15}}/>
      <View style={{position:'absolute',width:height*0.45,height:height*0.45,borderRadius:height*0.225,backgroundColor:'rgba(255,255,255,0.02)',bottom:-height*0.08,left:-height*0.12}}/>
      <View style={{position:'absolute',width:height*0.3,height:height*0.3,borderRadius:height*0.15,backgroundColor:'rgba(255,255,255,0.018)',top:height*0.55,right:height*0.1}}/>
    </View>
    <Animated.View style={{alignItems:'center',opacity:fadeAnim,transform:[{scale:scaleAnim}]}}>
      <Animated.View style={{width:circleSize,height:circleSize,borderRadius:circleSize/2,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,0.1)',transform:[{scale:breathe.interpolate({inputRange:[0,1],outputRange:[0.97,1.03]})}],shadowColor:'#fff',shadowOpacity:0.06,shadowRadius:30,shadowOffset:{width:0,height:0},elevation:8}}>
        <Svg width={circleSize*0.52} height={circleSize*0.52} viewBox="0 0 100 100" fill="none">
          <G opacity={0.9}>
            <Path d="M50 25 C50 25, 62 35, 62 48 C62 56, 56 62, 50 62 C44 62, 38 56, 38 48 C38 35, 50 25, 50 25Z" fill="rgba(255,255,255,0.85)"/>
            <Path d="M50 25 C50 25, 38 20, 30 30 C22 40, 30 52, 38 50" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none"/>
            <Path d="M50 25 C50 25, 62 20, 70 30 C78 40, 70 52, 62 50" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none"/>
            <Path d="M50 62 C50 62, 50 72, 50 82" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            <Path d="M50 70 C46 66, 40 66, 38 70" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            <Path d="M50 74 C54 70, 60 70, 62 74" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            <Circle cx="50" cy="42" r="3" fill="rgba(255,255,255,0.4)"/>
            <Path d="M35 44 C28 48, 22 58, 28 65 C34 72, 42 65, 42 58" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none"/>
            <Path d="M65 44 C72 48, 78 58, 72 65 C66 72, 58 65, 58 58" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none"/>
          </G>
        </Svg>
      </Animated.View>
      <View style={{marginTop:28,alignItems:'center'}}>
        <T style={{color:'#fff',fontSize:34,fontWeight:'900',letterSpacing:1,fontFamily:'HindSiliguriMedium'}}>{typed}<Animated.View style={{width:2,height:28,backgroundColor:'#fff',borderRadius:1,marginLeft:2,opacity:glowAnim,alignSelf:'flex-end',marginBottom:4}}/></T>
      </View>
    </Animated.View>
    <View style={{position:'absolute',bottom:36,alignItems:'center'}}>
      <T style={{color:'rgba(255,255,255,0.2)',fontSize:9,fontWeight:'500',letterSpacing:1}}>LEKHONI KAHINI</T>
    </View>
  </View>;
}

function SkeletonPulse({width,height:ht,borderRadius=8,style}:{width:number|string;height:number|string;borderRadius?:number;style?:any}){
  const anim=useRef(new Animated.Value(0.3)).current;
  useEffect(()=>{Animated.loop(Animated.sequence([Animated.timing(anim,{toValue:0.8,duration:800,useNativeDriver:true}),Animated.timing(anim,{toValue:0.3,duration:800,useNativeDriver:true})])).start()},[]);
  return <Animated.View style={[{width,height:ht,borderRadius,backgroundColor:'#D1D5DB',opacity:anim},style]}/>;
}

function SkeletonScreen({theme}:{theme:Theme}){
  return <View style={{flex:1,backgroundColor:theme.bg,paddingHorizontal:18,paddingTop:60}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
      <View><SkeletonPulse width={180} height={22} borderRadius={6}/><SkeletonPulse width={120} height={14} borderRadius={4} style={{marginTop:8}}/></View>
      <View style={{flexDirection:'row',gap:12}}><SkeletonPulse width={24} height={24} borderRadius={12}/><SkeletonPulse width={24} height={24} borderRadius={12}/></View>
    </View>
    <SkeletonPulse width={160} height={18} borderRadius={4} style={{marginBottom:12}}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,marginBottom:24}}>
      {[1,2,3].map(i=><View key={i} style={{width:130}}>
        <SkeletonPulse width={130} height={170} borderRadius={14}/>
        <SkeletonPulse width={100} height={14} borderRadius={4} style={{marginTop:8}}/>
        <SkeletonPulse width={80} height={11} borderRadius={3} style={{marginTop:6}}/>
      </View>)}
    </ScrollView>
    <SkeletonPulse width={160} height={18} borderRadius={4} style={{marginBottom:12}}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,marginBottom:24}}>
      {[1,2,3].map(i=><View key={i} style={{width:130}}>
        <SkeletonPulse width={130} height={170} borderRadius={14}/>
        <SkeletonPulse width={100} height={14} borderRadius={4} style={{marginTop:8}}/>
        <SkeletonPulse width={80} height={11} borderRadius={3} style={{marginTop:6}}/>
      </View>)}
    </ScrollView>
    <SkeletonPulse width={160} height={18} borderRadius={4} style={{marginBottom:12}}/>
    {[1,2].map(i=><View key={i} style={{flexDirection:'row',gap:12,marginBottom:12}}>
      <SkeletonPulse width={80} height={100} borderRadius={12}/>
      <View style={{flex:1}}><SkeletonPulse width={'80%'} height={16} borderRadius={4}/><SkeletonPulse width={'60%'} height={12} borderRadius={3} style={{marginTop:8}}/><SkeletonPulse width={'40%'} height={12} borderRadius={3} style={{marginTop:6}}/></View>
    </View>)}
    <View style={{position:'absolute',bottom:40,left:0,right:0}}>
      <View style={{height:56,backgroundColor:theme.card,borderRadius:28,marginHorizontal:20,borderWidth:1,borderColor:theme.line}}/>
    </View>
  </View>;
}

function ErrorScreen({type,onRetry,theme}:{type:'offline'|'error';theme:Theme;onRetry:()=>void}){
  const isOffline=type==='offline';
  const{height}=useWindowDimensions();
  return <View style={{flex:1,backgroundColor:theme.bg,alignItems:'center',justifyContent:'center',paddingHorizontal:40}}>
    <View style={{width:80,height:80,borderRadius:40,backgroundColor:isOffline?'#FEF3C7':'#FEE2E2',alignItems:'center',justifyContent:'center',marginBottom:24}}>
      <Feather name={isOffline?'wifi-off':'alert-circle'} size={36} color={isOffline?'#D97706':'#DC2626'}/>
    </View>
    <T style={{fontSize:20,fontWeight:'900',color:theme.ink,marginBottom:8,textAlign:'center'}}>{isOffline?'ইন্টারনেট সংযোগ নেই':'কিছু ভুল হয়েছে'}</T>
    <T style={{fontSize:14,fontWeight:'500',color:theme.muted,textAlign:'center',lineHeight:22,marginBottom:32}}>{isOffline?'ইন্টারনেট সংযোগ দিন এবং পুনরায় চেষ্টা করুন':'পুনরায় চেষ্টা করুন'}</T>
    <Pressable onPress={onRetry} style={{backgroundColor:'#7B1E2B',paddingHorizontal:32,paddingVertical:14,borderRadius:14,flexDirection:'row',alignItems:'center',gap:8}}>
      <Feather name="refresh-cw" size={18} color="#fff"/>
      <T style={{color:'#fff',fontSize:16,fontWeight:'800'}}>পুনরায় চেষ্টা করুন</T>
    </Pressable>
  </View>;
}

function OfflineBanner({theme,onRetry}:{theme:Theme;onRetry:()=>void}){
  return <View style={{backgroundColor:'#FEF3C7',borderRadius:12,padding:14,marginBottom:16,borderWidth:1,borderColor:'#F59E0B',flexDirection:'row',alignItems:'center',gap:12}}>
    <View style={{width:40,height:40,borderRadius:20,backgroundColor:'#FDE68A',alignItems:'center',justifyContent:'center'}}>
      <Feather name="wifi-off" size={18} color="#D97706"/>
    </View>
    <View style={{flex:1}}>
      <T style={{fontSize:13,fontWeight:'700',color:'#92400E'}}>ইন্টারনেট সংযোগ নেই</T>
      <T style={{fontSize:11,color:'#A16207',marginTop:2}}>অফলাইনে কাজ চলছে</T>
    </View>
    <Pressable onPress={onRetry} style={{backgroundColor:'#D97706',borderRadius:8,paddingHorizontal:12,paddingVertical:8}}>
      <T style={{fontSize:11,fontWeight:'700',color:'#fff'}}>সংযোগ করুন</T>
    </Pressable>
  </View>;
}

async function registerForPushNotificationsAsync(handler:(n:any)=>void){
  try{
    if(!Device||!Device.isDevice){return}
    const {status:existingStatus}=await ExpoNotifications.getPermissionsAsync();
    let finalStatus=existingStatus;
    if(existingStatus!=='granted'){
      const {status}=await ExpoNotifications.requestPermissionsAsync();
      finalStatus=status;
    }
    if(finalStatus!=='granted'){return}
    const token=(await ExpoNotifications.getExpoPushTokenAsync({projectId:'659b4215-d07c-41f8-881b-c3e7cd7e951a'})).data;
    if(Platform.OS==='android'){ExpoNotifications.setNotificationChannelAsync('default',{name:'default',importance:ExpoNotifications.AndroidImportance.MAX,vibrationPattern:[0,250,250,250],lightColor:'#FF231F7C'});}
    const sub=ExpoNotifications.addNotificationReceivedListener(handler);
    return{sub};
  }catch{return}
}

export default function App(){ return <SafeAreaProvider><AppShell/></SafeAreaProvider>; }
function AppShell(){
 const [fontsLoaded]=useFonts({HindSiliguriMedium:require('./assets/HindSiliguri-Medium.ttf'),IMFellEnglish:require('./assets/IMFellEnglish.ttf')});
  const [state,setState]=useState<LocalState>(initialState); const [loaded,setLoaded]=useState(false); const [dataLoaded,setDataLoaded]=useState(false); const [screen,_setScreen]=useState<Screen>({type:'main'}); const screenHistoryRef=useRef<Screen[]>([]); const [tab,setTab]=useState<Tab>('home'); const [allBooks,setAllBooks]=useState<Book[]>([]); const [allCategories,setAllCategories]=useState<[string,string,string,string|null][]>([]); const [publicWriters,setPublicWriters]=useState<import('./src/types').WriterProfile[]>([]); const [homeData,setHomeData]=useState<HomeSectionsData|null>(null); const [remoteNotices,setRemoteNotices]=useState<{id:string;title:string;body:string;icon:string;url:string;story_cover:string;time:string}[]>([]); const syncRef=useRef(false); const [showExitModal,setShowExitModal]=useState(false);
  const [transBook,setTransBook]=useState<{book:Book;fromX:number;fromY:number;fromW:number;fromH:number}|null>(null);
  const transAnim=useRef(new Animated.Value(0)).current;
  const {width:screenW,height:screenH}=useWindowDimensions();
  const openWithAnim=(book:Book,fromX:number,fromY:number,fromW:number,fromH:number)=>{setTransBook({book,fromX,fromY,fromW,fromH});transAnim.setValue(0);Animated.timing(transAnim,{toValue:1,duration:320,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start(()=>{setTransBook(null);open(book.id)})};
 const theme=themeFor(state.settings.themeId,state.settings.dark);
  const [dlBooks,setDlBooks]=useState<Record<string,Book>>({});
  useEffect(()=>{getOfflineBookIds().then(async ids=>{const loaded:Record<string,Book>={};for(const id of ids){const b=await loadBookOffline(id);if(b)loaded[id]=b}setDlBooks(loaded)}).catch(()=>{})},[]);
  const persistDl=(next:Record<string,Book>)=>{setDlBooks(next)};
  const downloadBook=async(id:string)=>{const existing=dlBooks[id];if(existing)return;const full=await fetchRemoteBook(id);if(!full||!full.chapters.length)return;await saveBookOffline(full);persistDl({...dlBooks,[id]:full});setState(s=>s.downloads.includes(id)?s:{...s,downloads:[...s.downloads,id]})};
  const removeDownload=async(id:string)=>{await removeBookOffline(id);const n={...dlBooks};delete n[id];persistDl(n);setState(s=>({...s,downloads:s.downloads.filter(x=>x!==id)}))};
  const resolveBook=(id:string):Book|undefined=>dlBooks[id]||allBooks.find(b=>b.id===id);
  useEffect(()=>{loadState().then(async v=>{const id=v.deviceId;if(id){try{const r=await fetchUserState(id);if(r&&r.synced&&r.state){const st=r.state;const remoteSettings=st.settings&&typeof st.settings==='object'?(st.settings as any):null;v={...v,settings:remoteSettings?{...v.settings,...remoteSettings}:v.settings,history:Array.isArray(st.history)&&st.history.length?[...new Set([...(v.history||[]),...st.history])].slice(0,20):v.history,positions:st.positions&&typeof st.positions==='object'?{...v.positions,...(st.positions as any)}:v.positions,bookmarks:Array.isArray(st.bookmarks)&&st.bookmarks.length?[...new Set([...v.bookmarks,...(st.bookmarks as any[])])].slice(0,50):v.bookmarks}}}catch{}}if(v.userToken){try{const u=await verifyUserToken(v.userToken);if(u)v.user=u;else{v.user=null;v.userToken=null;}}catch{v.user=null;v.userToken=null;}}if(v.writerToken){try{const wv=await verifyWriterToken(v.writerToken);if(wv)v.writer={id:wv.id,username:wv.username,writer_name:wv.writer_name,avatar_url:wv.avatar_url||undefined,bio:wv.bio||undefined};else{v.writer=null;v.writerToken=null;}}catch{v.writer=null;v.writerToken=null;}}if(v.writer&&!v.writer.id){v.writer=null;v.writerToken=null;}setState(v);setLoaded(true)})},[]); useEffect(()=>{if(loaded)saveState(state)},[state,loaded]);
  useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(screen.type!=='main'){const prev=screenHistoryRef.current;const last=prev[prev.length-1];if(last){screenHistoryRef.current=prev.slice(0,-1);setScreen(last)}else{setScreen({type:'main'});setTab('home')}return true}if(tab!=='home'){setTab('home');return true}setShowExitModal(true);return true});return()=>sub.remove()},[screen,tab]);
  const syncRemote=useCallback(async()=>{if(syncRef.current)return;syncRef.current=true;try{const[remote,cats,notices,writers,hdata]=await Promise.all([fetchRemoteBooks(),fetchRemoteCategories(),fetchRemoteNotifications(state.deviceId),fetchPublicWriters(),fetchHomeSections()]);if(remote.length){setAllBooks(remote.map(b => b.views_visible !== false && (hdata?.viewsVisible !== false) ? { ...b, views_visible: true } : { ...b, views_visible: false }));if(cats.length)setAllCategories(cats.map(c=>[c.name,c.icon,c.color,c.cover_url||null] as [string,string,string,string|null]));if(notices.length)setRemoteNotices(notices.map(n=>({id:n.id,title:n.title,body:n.body,icon:n.icon||'bell',url:n.url||'',story_cover:n.story_cover||'',time:n.created_at})));if(writers.length)setPublicWriters(writers);if(hdata&&hdata.sections&&hdata.sections.length){setHomeData({...hdata,sections:(hdata.sections||[]).map(x=>({...x,books:(x.books||[]).map((b:any)=>({...b,views_visible:(b.views_visible!==false&&(hdata.viewsVisible!==false))}))}))});if(!writers.length&&hdata.writers&&hdata.writers.length)setPublicWriters(hdata.writers.map(w=>({id:w.id,username:w.username||w.writer_name,writer_name:w.writer_name,bio:w.bio,avatar_url:w.avatar_url,follower_count:w.follower_count,badge:w.badge||'none'})));}setState(s=>({...s,online:true,remoteBooks:remote,lastSync:new Date().toISOString()}));setDataLoaded(true)}else{setState(s=>({...s,online:false}))}}catch{setState(s=>({...s,online:false}));setIsOffline(true)}finally{syncRef.current=false}},[state.deviceId]);
  useEffect(()=>{const id=setInterval(syncRemote,30000);syncRemote();return()=>clearInterval(id)},[syncRemote]);
  // --- AdMob: Init all ads + App Open on resume ---
  useEffect(()=>{initAllAds().then(()=>{setTimeout(()=>{try{showAppOpenAd()}catch{}},3000)});const sub=AppState.addEventListener('change',(s)=>{if(s==='active')try{showAppOpenAd()}catch{}});return()=>sub.remove()},[]);
  useEffect(()=>{if(!loaded||!state.deviceId)return;const t=setTimeout(()=>{saveUserState(state.deviceId,{settings:{...state.settings,name:state.name} as any,favorites:state.favorites,downloads:state.downloads,history:state.history,positions:state.positions,bookmarks:state.bookmarks as any}).catch(()=>{})},2000);return()=>clearTimeout(t)},[loaded,state]);
  useEffect(()=>{_curLang=state.settings.language},[state.settings.language]);
  // Push notification registration
  useEffect(()=>{
    if(!loaded||!state.deviceId)return;
    let sub:any;
    registerForPushNotificationsAsync((n:any)=>{}).then(listeners=>{
      if(listeners)sub=listeners.sub;
    }).catch(()=>{});
    return()=>{sub?.remove()};
  },[loaded,state.deviceId]);

  const handleNotifAllow=async()=>{
    setShowNotifPrompt(false);
    try{await ExpoNotifications.requestPermissionsAsync()}catch{}
  };
  // Handle notification taps
  useEffect(()=>{
    const resp=ExpoNotifications.addNotificationResponseReceivedListener((r:any)=>{
      const url=String(r.notification.request.content.data?.url||'');
      if(url)Linking.openURL(url).catch(()=>{});
    });
    return()=>resp.remove();
  },[]);
  // Redirect to main if reader book not found
  useEffect(()=>{if(screen.type==='reader'&&!resolveBook(screen.id)){screenHistoryRef.current=[];_setScreen({type:'main'});setTab('home')}},[screen,allBooks,dlBooks]);
  const update=(p:Partial<LocalState>)=>setState(s=>({...s,...p})); const setScreen=(s:Screen)=>{screenHistoryRef.current=[...screenHistoryRef.current,screen];_setScreen(s)}; const goBack=()=>{const prev=screenHistoryRef.current;const last=prev[prev.length-1];if(last){screenHistoryRef.current=prev.slice(0,-1);_setScreen(last)}else{_setScreen({type:'main'});setTab('home')}}; const open=(id:string)=>{update({history:[id,...state.history.filter(x=>x!==id)].slice(0,20)});setScreen({type:'book',id})}; const read=(id:string,chapter:number)=>{const bk=allBooks.find((b:any)=>b.id===id);const ch=bk?.chapters?.[chapter];if(ch?.reward_ad&&!state.unlockedChapters.includes(ch.id))return;if(bk?.show_ads!==false)maybeShowInterstitial();setScreen({type:'reader',id,chapter})};
  const filteredWriters=React.useMemo(()=>state.writer?publicWriters.filter(w=>w.id!==state.writer!.id):publicWriters,[publicWriters,state.writer]);
  const [splashPhase,setSplashPhase]=useState<'splash'|'loading'|'done'>('splash');
  const [showNotifPrompt,setShowNotifPrompt]=useState(false);
  const [loadError,setLoadError]=useState<string|null>(null);
  const [isOffline,setIsOffline]=useState(false);
  const [retryCount,setRetryCount]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setSplashPhase('loading'),800);return()=>clearTimeout(t)},[]);
  useEffect(()=>{if(splashPhase!=='loading')return;const t=setTimeout(()=>{if(!loaded&&!isOffline)setLoadError('timeout')},15000);return()=>clearTimeout(t)},[splashPhase,loaded,isOffline]);
  // Real-time network detection (dynamic import for native module compat)
  useEffect(()=>{const unsub=NetInfo.addEventListener((s:any)=>{const off=!s.isConnected||!s.isInternetReachable;setIsOffline(off)});return()=>{unsub()}},[]);
  const common=React.useMemo(()=>({theme,state,update,setScreen,goBack,open,read,allBooks,allCategories,publicWriters:filteredWriters,homeData,remoteNotices,dlBooks,downloadBook,removeDownload,dataLoaded,syncRemote,openWithAnim,isOffline}),[theme,state,allBooks,allCategories,filteredWriters,homeData,remoteNotices,dlBooks,dataLoaded,syncRemote,isOffline]);
  if(splashPhase==='splash')return <SplashScreen theme={theme}/>;
  if(splashPhase==='loading'){
    if(isOffline)return <ErrorScreen type="offline" theme={theme} onRetry={()=>{setIsOffline(false);setLoadError(null);setRetryCount(c=>c+1);syncRemote()}}/>;
    if(loadError==='timeout')return <ErrorScreen type="error" theme={theme} onRetry={()=>{setLoadError(null);setRetryCount(c=>c+1);syncRemote()}}/>;
    if(!loaded)return <SkeletonScreen theme={theme}/>;
  }
  if(splashPhase==='loading'&&loaded)setSplashPhase('done');
  if(!state.ageVerified)return <AgeGate theme={theme} lang={state.settings.language} onDone={()=>update({ageVerified:true})}/>;
  if(!state.name)return <NameGate theme={theme} lang={state.settings.language} onDone={(name,lang)=>{update({name,settings:{...state.settings,language:lang}})}}/>;
   let body:React.ReactNode;
 if(screen.type==='main')body=<Main {...common} tab={tab} setTab={setTab}/>;
 if(screen.type==='book'){const rb=resolveBook(screen.id);if(rb){if(rb.pdf_url){body=<PdfDetailsScreen {...common} book={rb}/>}else{body=<Details {...common} book={rb}/>}}}
  if(screen.type==='reader'){const rb=resolveBook(screen.id);if(rb){body=<Reader {...common} book={rb} chapter={screen.chapter}/>}}
 if(screen.type==='search')body=<Search {...common}/>; if(screen.type==='notifications')body=<Notifications {...common}/>; if(screen.type==='settings')body=<Settings {...common}/>; if(screen.type==='writer')body=<Writer {...common}/>;
   if(screen.type==='list')body=<BookList {...common} title={screen.title} ids={screen.ids}/>;
   if(screen.type==='comments')body=<Comments {...common} bookId={screen.id}/>;
  if(screen.type==='profileDetails')body=<ProfileDetails {...common}/>;
  if(screen.type==='followedWriters')body=<FollowedWritersList {...common}/>;
  if(screen.type==='writerProfile')body=<WriterProfileView {...common} writer={screen.writer}/>;
  if(screen.type==='allWriters')body=<AllWritersList {...common}/>;
  if(screen.type==='newStory')body=<NewStoryScreen token={state.writerToken||''} theme={theme} lang={state.settings.language} categories={allCategories.map(c=>c[0])} onBack={goBack} onCreated={goBack}/>;
  if(screen.type==='newPdfStory')body=<NewStoryScreen token={state.writerToken||''} theme={theme} lang={state.settings.language} categories={allCategories.map(c=>c[0])} onBack={goBack} onCreated={goBack} initialMode="pdf"/>;
  if(screen.type==='pdfReader')body=<PDFReaderScreen theme={theme} lang={state.settings.language} pdfUrl={screen.pdfUrl} title={screen.title} onBack={goBack}/>;
  if(screen.type==='editStory')body=<EditStoryScreen token={state.writerToken||''} theme={theme} lang={state.settings.language} storyId={screen.id} initialTitle={screen.title} initialDesc={screen.desc} initialCover={screen.coverUrl} initialWriterStatus={screen.writerStatus} onBack={goBack} onSaved={syncRemote}/>;
  if(screen.type==='aboutApp')body=<AboutAppScreen theme={theme} lang={state.settings.language} onBack={goBack}/>;
  if(screen.type==='terms')body=<TermsScreen theme={theme} lang={state.settings.language} onBack={goBack}/>;
  if(screen.type==='guide')body=<GuideScreen theme={theme} lang={state.settings.language} onBack={goBack} onWriter={()=>setScreen({type:'writer'})} setScreen={setScreen}/>;
  const isNewTheme=['nilkantha','kashful','mala','meghdoot','bashanti','sona','rong','agun','swapna','prithvi'].includes(state.settings.themeId);
  const themeBg=isNewTheme?themeFor(state.settings.themeId,state.settings.dark).bg:theme.bg;
  return <View style={{flex:1,backgroundColor:themeBg}}>
    {isNewTheme&&<ThemeBackground themeId={state.settings.themeId} dark={state.settings.dark}/>}
    <StatusBar style={state.settings.dark?'light':'dark'}/>{body}
    {transBook&&transBook.book.cover_url&&<Animated.View style={{position:'absolute',left:transAnim.interpolate({inputRange:[0,1],outputRange:[transBook.fromX,16]}),top:transAnim.interpolate({inputRange:[0,1],outputRange:[transBook.fromY,90]}),width:transAnim.interpolate({inputRange:[0,1],outputRange:[transBook.fromW,Dimensions.get('window').width-32]}),height:transAnim.interpolate({inputRange:[0,1],outputRange:[transBook.fromH,240]}),borderRadius:transAnim.interpolate({inputRange:[0,1],outputRange:[10,24]}),overflow:'hidden',elevation:20,shadowColor:'#000',shadowOpacity:0.3,shadowRadius:20,shadowOffset:{width:0,height:10},zIndex:998}}><Image source={{uri:transBook.book.cover_url}} style={{width:'100%',height:'100%'}} resizeMode="cover"/></Animated.View>}
    {showExitModal&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',zIndex:999}}><View style={{backgroundColor:theme.card,borderRadius:24,padding:28,marginHorizontal:40,alignItems:'center',borderWidth:1,borderColor:theme.line,shadowColor:'#000',shadowOpacity:0.2,shadowRadius:20,shadowOffset:{width:0,height:10},elevation:10}}>
        <View style={{width:72,height:72,borderRadius:20,backgroundColor:theme.primary+'18',alignItems:'center',justifyContent:'center',marginBottom:18}}>
          <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
            <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={theme.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            <Polyline points="16 17 21 12 16 7" stroke={theme.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            <Line x1="21" y1="12" x2="9" y2="12" stroke={theme.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:theme.ink,marginBottom:8,textAlign:'center'}}>{'অ্যাপ থেকে প্রস্থান'}</T>
        <T style={{fontSize:13,color:theme.muted,textAlign:'center',lineHeight:20,marginBottom:24}}>{'আপনি কি নিশ্চিতভাবেই Lekhoni Kahini অ্যাপ থেকে বের হতে চান? আপনার পছন্দের গল্পগুলো অপেক্ষা করছে।'}</T>
        <View style={{flexDirection:'row',gap:10,width:'100%'}}>
          <Pressable onPress={()=>setShowExitModal(false)} style={{flex:1,backgroundColor:theme.primary,paddingVertical:14,borderRadius:14,alignItems:'center'}}>
            <T style={{fontSize:14,fontWeight:'800',color:'#fff'}}>{'থাকুন'}</T>
          </Pressable>
          <Pressable onPress={()=>BackHandler.exitApp()} style={{flex:1,backgroundColor:theme.tint,borderWidth:1.5,borderColor:theme.line,paddingVertical:14,borderRadius:14,alignItems:'center'}}>
            <T style={{fontSize:14,fontWeight:'800',color:'#EF4444'}}>{'বের হোন'}</T>
          </Pressable>
        </View>
      </View></View>}{showNotifPrompt&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',zIndex:999}}><View style={{backgroundColor:theme.card,borderRadius:24,padding:28,marginHorizontal:32,alignItems:'center',borderWidth:1,borderColor:theme.line,shadowColor:'#000',shadowOpacity:0.2,shadowRadius:20,shadowOffset:{width:0,height:10},elevation:10}}>
        <View style={{width:80,height:80,borderRadius:20,backgroundColor:theme.primary+'18',alignItems:'center',justifyContent:'center',marginBottom:18}}>
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={theme.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={theme.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:theme.ink,marginBottom:8,textAlign:'center'}}>{'নোটিফিকেশন চালু করুন'}</T>
        <T style={{fontSize:13,color:theme.muted,textAlign:'center',lineHeight:20,marginBottom:24}}>{'নতুন গল্প, অধ্যায় ও ফলোয়ারদের আপডেট পেতে নোটিফিকেশন চালু করুন। আপনি যেকোনো সময় বন্ধ করতে পারবেন।'}</T>
        <View style={{flexDirection:'row',gap:10,width:'100%'}}>
          <Pressable onPress={()=>{update({pushPromptDismissed:true});setShowNotifPrompt(false)}} style={{flex:1,backgroundColor:theme.tint,borderWidth:1.5,borderColor:theme.line,paddingVertical:14,borderRadius:14,alignItems:'center'}}>
            <T style={{fontSize:14,fontWeight:'800',color:theme.muted}}>{'পরে'}</T>
          </Pressable>
          <Pressable onPress={handleNotifAllow} style={{flex:1,backgroundColor:theme.primary,paddingVertical:14,borderRadius:14,alignItems:'center'}}>
            <T style={{fontSize:14,fontWeight:'800',color:'#fff'}}>{'অনুমতি দিন'}</T>
          </Pressable>
        </View>
      </View></View>}</View>;
}
type C={theme:Theme;state:LocalState;update:(p:Partial<LocalState>)=>void;setScreen:(s:Screen)=>void;goBack:()=>void;open:(id:string)=>void;read:(id:string,c:number)=>void;allBooks:Book[];allCategories:[string,string,string,string|null][];publicWriters:import('./src/types').WriterProfile[];homeData:HomeSectionsData|null;remoteNotices:{id:string;title:string;body:string;icon:string;url:string;story_cover:string;time:string}[];dlBooks:Record<string,Book>;downloadBook:(id:string)=>void;removeDownload:(id:string)=>void;dataLoaded:boolean;syncRemote?:()=>void;openWithAnim:(book:Book,fromX:number,fromY:number,fromW:number,fromH:number)=>void;isOffline:boolean};
const F_BN='HindSiliguriMedium';
const F_EN='IMFellEnglish';
let _curLang:import('./src/types').Language='bn';
const GF=()=>_curLang==='en'?F_EN:F_BN;
function T({style,...rest}:React.ComponentProps<typeof Text>){return <Text {...rest} style={[style,{fontFamily:GF(),fontWeight:'500'}]}/>}
const tr=(p:C,key:CopyKey)=>copy(p.state.settings.language,key);
function greet(p:C){const h=new Date().getHours();const key=h<12?'morning':h<17?'afternoon':h<21?'evening':'night';return tr(p,key as CopyKey);}
function ThemeBackground({themeId,dark}:{themeId:string;dark:boolean}){
  const isNew=['nilkantha','kashful','mala','meghdoot','bashanti','sona','rong','agun','swapna','prithvi'].includes(themeId);
  if(!isNew)return null;
  const p=themeFor(themeId as any,dark);
  const pc=p.primary;const bgc=p.bg;
  const A={position:'absolute' as const,top:0,left:0,right:0,bottom:0,overflow:'hidden' as const};
  switch(themeId){
    case 'nilkantha':
      return <View style={A} pointerEvents="none">
        <LinearGradient colors={[pc+'40',pc+'15',bgc]} start={{x:0,y:0}} end={{x:0.7,y:1}} style={{flex:1}}/>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" style={{position:'absolute',top:0,left:0}}>
          <G opacity={0.12} transform="translate(280,80)">
            <Circle r="20" fill={pc}/>
            <Ellipse rx="10" ry="30" fill={pc} transform="translate(0,-25)"/>
            <Ellipse rx="10" ry="30" fill={pc} transform="rotate(45) translate(0,-25)"/>
            <Ellipse rx="10" ry="30" fill={pc} transform="rotate(90) translate(0,-25)"/>
            <Ellipse rx="10" ry="30" fill={pc} transform="rotate(135) translate(0,-25)"/>
            <Ellipse rx="10" ry="30" fill={pc} transform="rotate(180) translate(0,-25)"/>
            <Ellipse rx="10" ry="30" fill={pc} transform="rotate(225) translate(0,-25)"/>
            <Ellipse rx="10" ry="30" fill={pc} transform="rotate(270) translate(0,-25)"/>
            <Ellipse rx="10" ry="30" fill={pc} transform="rotate(315) translate(0,-25)"/>
          </G>
          <Path d="M0 350 Q100 320 200 360 Q300 400 400 350" stroke={pc} strokeWidth="2" fill="none" opacity={0.06}/>
          <Path d="M0 380 Q100 350 200 390 Q300 430 400 380" stroke={pc} strokeWidth="1.5" fill="none" opacity={0.04}/>
          <Circle cx="350" cy="600" r="30" fill={pc} opacity={0.06}/>
          <Circle cx="80" cy="700" r="20" fill={pc} opacity={0.05}/>
        </Svg>
      </View>;
    case 'kashful':
      return <View style={A} pointerEvents="none">
        <LinearGradient colors={[pc+'35',pc+'12',bgc]} start={{x:0.3,y:0}} end={{x:0.7,y:1}} style={{flex:1}}/>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" style={{position:'absolute',top:0,left:0}}>
          <G opacity={0.10}>
            <Path d="M60 800 L60 200" stroke={pc} strokeWidth="3" fill="none"/>
            <Circle cx="60" cy="180" r="18" fill={pc}/>
            <Circle cx="60" cy="180" r="10" fill={pc} opacity={0.5}/>
            <Path d="M60 200 Q40 160 50 130 Q55 145 60 200" fill={pc} opacity={0.6}/>
            <Path d="M60 200 Q80 160 70 130 Q65 145 60 200" fill={pc} opacity={0.6}/>
          </G>
          <G opacity={0.07}>
            <Path d="M300 800 L300 300" stroke={pc} strokeWidth="2" fill="none"/>
            <Path d="M300 300 Q285 260 290 230 Q295 250 300 300" fill={pc} opacity={0.5}/>
            <Path d="M300 300 Q315 260 310 230 Q305 250 300 300" fill={pc} opacity={0.5}/>
            <Path d="M300 340 Q280 310 285 280 Q295 300 300 340" fill={pc} opacity={0.35}/>
          </G>
          <Ellipse cx="180" cy="500" rx="50" ry="35" fill={pc} opacity={0.05}/>
          <Circle cx="350" cy="650" r="25" fill={pc} opacity={0.05}/>
        </Svg>
      </View>;
    case 'mala':
      return <View style={A} pointerEvents="none">
        <LinearGradient colors={[pc+'38',pc+'14',bgc]} start={{x:0,y:0}} end={{x:1,y:0.8}} style={{flex:1}}/>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" style={{position:'absolute',top:0,left:0}}>
          <G opacity={0.10}>
            <Circle cx="320" cy="120" r="35" fill={pc}/>
            <Circle cx="320" cy="120" r="20" fill={pc} opacity={0.5}/>
            <Ellipse rx="7" ry="16" fill={pc} opacity={0.7} transform="translate(320,100)"/>
            <Ellipse rx="7" ry="16" fill={pc} opacity={0.7} transform="rotate(72 320 120) translate(0,-20)"/>
            <Ellipse rx="7" ry="16" fill={pc} opacity={0.7} transform="rotate(144 320 120) translate(0,-20)"/>
            <Ellipse rx="7" ry="16" fill={pc} opacity={0.7} transform="rotate(216 320 120) translate(0,-20)"/>
            <Ellipse rx="7" ry="16" fill={pc} opacity={0.7} transform="rotate(288 320 120) translate(0,-20)"/>
          </G>
          <G opacity={0.06}>
            <Circle cx="100" cy="350" r="12" fill={pc}/>
            <Circle cx="130" cy="380" r="10" fill={pc}/>
            <Circle cx="110" cy="410" r="8" fill={pc}/>
            <Circle cx="140" cy="440" r="11" fill={pc}/>
            <Circle cx="120" cy="470" r="9" fill={pc}/>
            <Circle cx="150" cy="500" r="7" fill={pc}/>
          </G>
          <Circle cx="200" cy="650" r="20" fill={pc} opacity={0.05}/>
        </Svg>
      </View>;
    case 'meghdoot':
      return <View style={A} pointerEvents="none">
        <LinearGradient colors={[pc+'36',pc+'12',bgc]} start={{x:0,y:0}} end={{x:0.5,y:1}} style={{flex:1}}/>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" style={{position:'absolute',top:0,left:0}}>
          <G opacity={0.11} transform="translate(300,90)">
            <Circle r="25" fill={pc}/>
            <Circle r="14" fill={pc} opacity={0.5}/>
            <Path d="M0,-22 Q12,-50 0,-65 Q-12,-50 0,-22" fill={pc} opacity={0.8}/>
            <Path d="M22,0 Q50,-12 65,0 Q50,12 22,0" fill={pc} opacity={0.8}/>
            <Path d="M0,22 Q12,50 0,65 Q-12,50 0,22" fill={pc} opacity={0.8}/>
            <Path d="M-22,0 Q-50,-12 -65,0 Q-50,12 -22,0" fill={pc} opacity={0.8}/>
          </G>
          <G opacity={0.06}>
            <Ellipse cx="80" cy="300" rx="70" ry="30" fill={pc}/>
            <Ellipse cx="120" cy="290" rx="50" ry="25" fill={pc}/>
            <Ellipse cx="50" cy="295" rx="40" ry="20" fill={pc}/>
          </G>
          <G opacity={0.05}>
            <Ellipse cx="320" cy="550" rx="60" ry="25" fill={pc}/>
            <Ellipse cx="350" cy="540" rx="40" ry="20" fill={pc}/>
          </G>
        </Svg>
      </View>;
    case 'bashanti':
      return <View style={A} pointerEvents="none">
        <LinearGradient colors={[pc+'37',pc+'12',bgc]} start={{x:0.2,y:0}} end={{x:0.8,y:1}} style={{flex:1}}/>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" style={{position:'absolute',top:0,left:0}}>
          <G opacity={0.10} transform="translate(320,100)">
            <Circle r="15" fill={pc}/>
            <Circle r="8" fill={pc} opacity={0.5}/>
            <Ellipse rx="5" ry="22" fill={pc} opacity={0.7} transform="translate(0,-18) rotate(-10)"/>
            <Ellipse rx="5" ry="22" fill={pc} opacity={0.7} transform="rotate(72) translate(0,-18) rotate(-10)"/>
            <Ellipse rx="5" ry="22" fill={pc} opacity={0.7} transform="rotate(144) translate(0,-18) rotate(-10)"/>
            <Ellipse rx="5" ry="22" fill={pc} opacity={0.7} transform="rotate(216) translate(0,-18) rotate(-10)"/>
            <Ellipse rx="5" ry="22" fill={pc} opacity={0.7} transform="rotate(288) translate(0,-18) rotate(-10)"/>
            <Path d="M0,15 Q5,40 0,55 Q-5,40 0,15" fill={pc} opacity={0.4}/>
            <Path d="M-8,18 Q-20,35 -15,50 Q-5,40 -8,18" fill={pc} opacity={0.3}/>
            <Path d="M8,18 Q20,35 15,50 Q5,40 8,18" fill={pc} opacity={0.3}/>
          </G>
          <G opacity={0.06}>
            <Path d="M60 800 Q70 750 65 700 Q60 680 55 650 Q50 620 60 580" stroke={pc} strokeWidth="2" fill="none"/>
            <Ellipse cx="60" cy="570" rx="12" ry="8" fill={pc} opacity={0.5} transform="rotate(-20 60 570)"/>
            <Path d="M65 650 Q80 630 90 640 Q80 650 65 650" fill={pc} opacity={0.4}/>
            <Path d="M58 600 Q40 585 35 595 Q45 605 58 600" fill={pc} opacity={0.35}/>
          </G>
          <Circle cx="200" cy="680" r="18" fill={pc} opacity={0.05}/>
        </Svg>
      </View>;
    case 'sona':
      return <View style={A} pointerEvents="none">
        <LinearGradient colors={[pc+'3A',pc+'14',bgc]} start={{x:0,y:0}} end={{x:1,y:0.7}} style={{flex:1}}/>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" style={{position:'absolute',top:0,left:0}}>
          <Ellipse cx="300" cy="110" rx={110} ry={90} fill={pc} opacity={0.13}/>
          <Ellipse cx="80" cy="200" rx={90} ry={75} fill={pc} opacity={0.10}/>
          <Ellipse cx="200" cy="400" rx={130} ry={95} fill={pc} opacity={0.08}/>
          <Ellipse cx="350" cy="600" rx={75} ry={60} fill={pc} opacity={0.11}/>
          <Circle cx="130" cy="680" r={55} fill={pc} opacity={0.09}/>
        </Svg>
      </View>;
    case 'rong':
      return <View style={A} pointerEvents="none">
        <LinearGradient colors={[pc+'35',pc+'12',bgc]} start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:1}}/>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" style={{position:'absolute',top:0,left:0}}>
          <Ellipse cx="330" cy="130" rx={100} ry={85} fill={pc} opacity={0.12}/>
          <Ellipse cx="70" cy="300" rx={120} ry={95} fill={pc} opacity={0.10}/>
          <Ellipse cx="250" cy="550" rx={105} ry={80} fill={pc} opacity={0.08}/>
          <Circle cx="180" cy="70" r={55} fill={pc} opacity={0.11}/>
          <Circle cx="370" cy="700" r={45} fill={pc} opacity={0.09}/>
        </Svg>
      </View>;
    case 'agun':
      return <View style={A} pointerEvents="none">
        <LinearGradient colors={[pc+'38',pc+'14',bgc]} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={{flex:1}}/>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" style={{position:'absolute',top:0,left:0}}>
          <Ellipse cx="300" cy="90" rx={115} ry={100} fill={pc} opacity={0.13}/>
          <Ellipse cx="80" cy="250" rx={95} ry={85} fill={pc} opacity={0.10}/>
          <Ellipse cx="200" cy="450" rx={130} ry={90} fill={pc} opacity={0.08}/>
          <Ellipse cx="350" cy="600" rx={70} ry={60} fill={pc} opacity={0.11}/>
          <Circle cx="120" cy="700" r={50} fill={pc} opacity={0.09}/>
        </Svg>
      </View>;
    case 'swapna':
      return <View style={A} pointerEvents="none">
        <LinearGradient colors={[pc+'36',pc+'12',bgc]} start={{x:0,y:0}} end={{x:1,y:0.8}} style={{flex:1}}/>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" style={{position:'absolute',top:0,left:0}}>
          <Ellipse cx="320" cy="110" rx={105} ry={90} fill={pc} opacity={0.12}/>
          <Ellipse cx="60" cy="320" rx={120} ry={100} fill={pc} opacity={0.10}/>
          <Ellipse cx="220" cy="580" rx={100} ry={75} fill={pc} opacity={0.08}/>
          <Circle cx="150" cy="80" r={60} fill={pc} opacity={0.11}/>
          <Circle cx="360" cy="700" r={50} fill={pc} opacity={0.09}/>
        </Svg>
      </View>;
    case 'prithvi':
      return <View style={A} pointerEvents="none">
        <LinearGradient colors={[pc+'37',pc+'12',bgc]} start={{x:0,y:1}} end={{x:1,y:0}} style={{flex:1}}/>
        <Svg width="100%" height="100%" viewBox="0 0 400 800" style={{position:'absolute',top:0,left:0}}>
          <Ellipse cx="300" cy="100" rx={100} ry={85} fill={pc} opacity={0.12}/>
          <Ellipse cx="80" cy="300" rx={115} ry={95} fill={pc} opacity={0.10}/>
          <Ellipse cx="200" cy="550" rx={130} ry={85} fill={pc} opacity={0.08}/>
          <Circle cx="350" cy="680" r={60} fill={pc} opacity={0.11}/>
          <Circle cx="130" cy="70" r={45} fill={pc} opacity={0.09}/>
        </Svg>
      </View>;
    default:return null;
  }
}

function Page({children,theme,onRefresh,refreshing}:{children:React.ReactNode;theme:Theme;onRefresh?:()=>void;refreshing?:boolean}){const insets=useSafeAreaInsets();return <ScrollView style={{flex:1}} contentContainerStyle={{paddingTop:insets.top+12,paddingHorizontal:18,paddingBottom:110}} showsVerticalScrollIndicator={false} refreshControl={onRefresh?<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary}/>:undefined}>{children}</ScrollView>}
function AgeGate({theme:t,lang,onDone}:{theme:Theme;lang:import('./src/types').Language;onDone:()=>void}){
  const[checked,setChecked]=useState(false);
  const[curLang,setCurLang]=useState<import('./src/types').Language>(lang);
  const{height}=useWindowDimensions();
  return <KeyboardAvoidingView style={{flex:1,backgroundColor:t.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
    <ScrollView contentContainerStyle={{paddingHorizontal:25,paddingTop:height*0.15,paddingBottom:40}} keyboardShouldPersistTaps="handled">
      <View style={{alignItems:'center',marginBottom:24}}>
        <Image source={require('./assets/adaptive-icon.png')} style={[styles.gateIcon]} resizeMode="contain"/>
      </View>
      <T style={[styles.eyebrow,{color:t.primary,textAlign:'center'}]}>{copy(curLang,'ageGateTitle')}</T>
      <T style={[styles.gateTitle,{color:t.ink,textAlign:'center',fontSize:22,marginBottom:12}]}>Lekhoni Kahini</T>
      <Pressable onPress={()=>setChecked(!checked)} style={{flexDirection:'row',alignItems:'flex-start',gap:12,backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:20,borderWidth:1.5,borderColor:checked?t.primary:t.line}}>
        <View style={{width:24,height:24,borderRadius:8,borderWidth:2,borderColor:checked?t.primary:t.muted,backgroundColor:checked?t.primary:'transparent',alignItems:'center',justifyContent:'center',marginTop:2}}>
          {checked&&<Feather name="check" size={14} color="#fff"/>}
        </View>
        <View style={{flex:1}}>
          <T style={{fontSize:15,fontWeight:'700',color:t.ink,lineHeight:22}}>{copy(curLang,'ageGateText')}</T>
          <T style={{fontSize:12,color:t.muted,marginTop:4,lineHeight:18}}>{copy(curLang,'ageGateError')}</T>
        </View>
      </Pressable>
      <Pressable onPress={()=>{if(checked)onDone()}} disabled={!checked} style={{backgroundColor:checked?t.primary:t.line,borderRadius:14,height:50,alignItems:'center',justifyContent:'center',opacity:checked?1:0.5}}>
        <T style={{color:'#fff',fontWeight:'700',fontSize:15}}>{copy(curLang,'continueBtn')}</T>
      </Pressable>
      <View style={styles.langRow2}>
        {([['bn','বাংলা'],['en','English'],['hi','हिन्दी']] as [import('./src/types').Language,string][]).map(([code,label])=>
          <Pressable key={code} onPress={()=>setCurLang(code)} style={[styles.langBtn2,{backgroundColor:curLang===code?t.primary:t.card,borderColor:curLang===code?t.primary:t.line}]}>
            <T style={{color:curLang===code?'#fff':t.ink,fontWeight:'800',fontSize:13}}>{label}</T>
          </Pressable>
        )}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
function NameGate({theme,lang,onDone}:{theme:Theme;lang:import('./src/types').Language;onDone:(n:string,l:import('./src/types').Language)=>void}){const[name,setName]=useState('');const[curLang,setCurLang]=useState<import('./src/types').Language>(lang);const langs:[import('./src/types').Language,string][]=[['bn','বাংলা'],['en','English'],['hi','हिन्दी']];const{height}=useWindowDimensions();return <KeyboardAvoidingView style={{flex:1,backgroundColor:theme.bg}} behavior={Platform.OS==='ios'?'padding':'height'}><ScrollView contentContainerStyle={{paddingHorizontal:25,paddingTop:80,paddingBottom:40}} keyboardShouldPersistTaps="handled"><View style={{alignItems:'center',marginBottom:10}}><Image source={require('./assets/adaptive-icon.png')} style={[styles.gateIcon]} resizeMode="contain"/></View><T style={[styles.eyebrow,{color:theme.primary,textAlign:'center'}]}>{copy(curLang,'welcome')}</T><T style={[styles.gateTitle,{color:theme.ink,textAlign:'center'}]}>{copy(curLang,'nameQuestion')}</T><T style={[styles.copy,{color:theme.muted,textAlign:'center'}]}>{copy(curLang,'gateHint')}</T><TextInput autoFocus value={name} onChangeText={setName} placeholder={copy(curLang,'namePlaceholder')} placeholderTextColor={theme.muted} style={[styles.input,{color:theme.ink,backgroundColor:theme.card,borderColor:theme.line}]}/><Button title={copy(curLang,'startBtn')} icon="arrow-right" disabled={!name.trim()} onPress={()=>onDone(name.trim(),curLang)}/><T style={[styles.note,{color:theme.muted}]}>{copy(curLang,'nameNote')}</T><View style={styles.langRow2}>{langs.map(([code,label])=><Pressable key={code} onPress={()=>setCurLang(code)} style={[styles.langBtn2,{backgroundColor:curLang===code?theme.primary:theme.card,borderColor:curLang===code?theme.primary:theme.line}]}><T style={{color:curLang===code?'#fff':theme.ink,fontWeight:'800',fontSize:13}}>{label}</T></Pressable>)}</View></ScrollView></KeyboardAvoidingView>}
function Main(p:C&{tab:Tab;setTab:(t:Tab)=>void}){
 const {width:screenW}=useWindowDimensions();
 const {theme,tab,setTab}=p;
 const prevTab=React.useRef(tab);
 const content=React.useMemo(()=>tab==='home'?<Home {...p}/>:tab==='library'?<Library {...p}/>:tab==='categories'?<Categories {...p}/>:tab==='episodes'?<Episodes {...p}/>:<Profile {...p}/>,[tab,p.theme,p.state,p.allBooks,p.allCategories,p.publicWriters,p.homeData,p.remoteNotices,p.dlBooks]);
 const tabs:[Tab,string,CopyKey][]=[['home','home','home'],['library','book-open','library'],['categories','grid','categories'],['episodes','layers','episodes'],['profile','menu','menu']];
 const tabIdx=tabs.findIndex(x=>x[0]===tab);
 const slideAnim=React.useRef(new Animated.Value(tabIdx)).current;
 React.useEffect(()=>{Animated.timing(slideAnim,{toValue:tabIdx,duration:170,easing:Easing.bezier(0.25,0.1,0.25,1),useNativeDriver:false}).start();prevTab.current=tab},[tabIdx]);
 const navW=screenW-40;
 const itemW=(navW-12)/tabs.length;
 return <View style={{flex:1}}>{content}<View style={{position:'absolute',bottom:24,left:20,right:20,backgroundColor:theme.card,borderRadius:24,flexDirection:'row',paddingVertical:10,paddingHorizontal:6,shadowColor:'#000',shadowOpacity:0.08,shadowRadius:20,shadowOffset:{width:0,height:8},elevation:8,borderWidth:1,borderColor:theme.line,overflow:'hidden'}}><Animated.View style={{position:'absolute',top:10,bottom:10,left:6,width:itemW,backgroundColor:theme.tint,borderRadius:16,transform:[{translateX:slideAnim.interpolate({inputRange:[0,1,2,3,4],outputRange:[0,itemW,itemW*2,itemW*3,itemW*4]})}]}}/>{tabs.map((x,i)=><Pressable key={x[0]} onPress={()=>setTab(x[0])} style={{flex:1,alignItems:'center',gap:4,paddingVertical:6,zIndex:1}}><Feather name={I(x[1])} size={20} color={tab===x[0]?theme.primary:theme.muted}/><T allowFontScaling={false} numberOfLines={1} style={{fontSize:9,fontWeight:'800',color:tab===x[0]?theme.primary:theme.muted}}>{tr(p,x[2])}</T></Pressable>)}</View></View>
}
function Header({title,sub,theme,action,onNotif,unreadCount}:{title:string;sub?:string;theme:Theme;action?:React.ReactNode;onNotif?:()=>void;unreadCount?:number}){return <View style={styles.header}><View style={{flex:1,marginRight:12}}><T numberOfLines={1} style={[styles.title,{color:theme.ink}]}>{title}</T>{sub&&<T numberOfLines={1} style={{color:theme.muted,marginTop:4}}>{sub}</T>}</View><View style={{flexDirection:'row',alignItems:'center',gap:18}}>{action}<Pressable onPress={()=>onNotif?onNotif():null} style={{position:'relative'}}><Feather name="bell" size={20} color={theme.ink}/>{!!unreadCount&&<View style={[styles.badge,{backgroundColor:'#EF4444'}]}><T style={styles.badgeText}>{unreadCount}</T></View>}</Pressable></View></View>}
function HomeInner(p:C){const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;const books=p.allBooks;const hd=p.homeData;const[refreshing,setRefreshing]=useState(false);const doRefresh=async()=>{if(!p.syncRemote)return;setRefreshing(true);try{await p.syncRemote()}catch{}finally{setRefreshing(false)}};const toBook=(b:any):Book=>({id:b.id,title:b.title,author:b.author,views:`${b.views}`,rating:4.5,color:b.color,accent:b.accent,category:b.category||'',categoryIcon:'book-open',description:b.description||'',updated:'',chapters:[],isNew:Boolean(b.is_new),featured:Boolean(b.featured),views_visible:b.views_visible!==false,cover_url:b.cover_url||null,display_status:b.display_status||undefined,writer_status:b.writer_status||undefined,hide_title_on_cover:b.hide_title_on_cover||false,pdf_url:b.pdf_url||'',dedication:b.dedication||'',author_name:b.author_name||'',show_ads:b.show_ads!==false,pdf_reward_ad:b.pdf_reward_ad!==false});const hlist=(k:string):Book[]=>{if(hd){const s=hd.sections.find((x:any)=>x.key===k);if(s&&s.books&&s.books.length)return s.books.slice(0,12).map((b:any)=>toBook(b) as Book).filter((b:any)=>b&&b.id);}return[];};const hdtitle=(k:string)=>hd?(hd.sections.find((x:any)=>x.key===k)?.title||''):'';const byViews=(a:Book,b:Book)=>+b.views-(+a.views);const G='#2AA876',AU='#D9A407',BL='#3B82F6',PU='#8B5CF6';const section=(title:string,icon:string,accent:string,list:Book[],sectionKey?:string)=>!list.length?null:<View><View style={styles.secHead}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={[styles.secIcon,{backgroundColor:shade(accent,-30)}]}><Feather name={I(icon)} size={13} color="#fff"/></View><T style={[styles.sectionTitle,{color:p.theme.ink}]}>{title}</T></View><Pressable onPress={()=>p.setScreen({type:'list',title,ids:list.map(x=>x.id)})} style={[styles.seeAllPill,{backgroundColor:shade(accent,-30)}]}><T style={{color:'#fff',fontWeight:'900',fontSize:12,letterSpacing:0.3}}>{tr(p,'seeAllText')}</T></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{list.map((b,i)=><BookCard key={b.id} book={b} theme={p.theme} lang={p.state.settings.language} accent={accent} section={sectionKey} onPress={()=>p.open(b.id)}/>)}</ScrollView></View>;const followedIds=new Set(p.state.followedWriters.map(f=>f.id));const unfollowedWriters=p.publicWriters.filter(w=>!followedIds.has(w.id));const toggleFollowAuthor=async(w:import('./src/types').WriterProfile)=>{const followed=p.state.followedWriters.some(f=>f.id===w.id);if(followed){p.update({followedWriters:p.state.followedWriters.filter(f=>f.id!==w.id)});const ok=await unfollowWriter(p.state.deviceId,w.id);if(!ok)p.update({followedWriters:[...p.state.followedWriters,w]})}else{p.update({followedWriters:[...p.state.followedWriters,w]});const ok=await followWriter(p.state.deviceId,w.id,p.state.writer?.id,p.state.user?.id);if(!ok)p.update({followedWriters:p.state.followedWriters.filter(f=>f.id!==w.id)})}};const authors=()=>unfollowedWriters.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{unfollowedWriters.map(w=><AuthorCard key={w.id} writer={w} theme={p.theme} lang={p.state.settings.language} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} bookCount={p.allBooks.filter(b=>b.author===w.writer_name).length} isFollowed={p.state.followedWriters.some(f=>f.id===w.id)} onToggleFollow={()=>toggleFollowAuthor(w)}/>)}</ScrollView>:<Empty theme={p.theme}/>;const sections=hd?hd.sections:[];const isFixed=(k:string)=>['featured','mostPopular','newEpisodes','popularAuthors','weeklyPopular','monthlyPopular'].includes(k);const fixedSecs=sections.filter((s:any)=>isFixed(s.key));const catSecs=sections.filter((s:any)=>!isFixed(s.key));const renderFixed=(k:string)=>{if(k==='featured'){const fl=hlist('featured');return <Featured {...p} list={fl}/>;}if(k==='popularAuthors')return <View><View style={styles.secHead}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={[styles.secIcon,{backgroundColor:shade('#EC4899',-30)}]}><Feather name="users" size={13} color="#fff"/></View><T style={[styles.sectionTitle,{color:p.theme.ink}]}>{hdtitle('popularAuthors')||tr(p,'popularAuthors')}</T></View><Pressable onPress={()=>p.setScreen({type:'allWriters'})} style={[styles.seeAllPill,{backgroundColor:shade('#EC4899',-30)}]}><T style={{color:'#fff',fontWeight:'900',fontSize:12,letterSpacing:0.3}}>{tr(p,'seeAllText')}</T></Pressable></View>{authors()}</View>;if(k==='newEpisodes'){const l=hlist('newEpisodes');return section(hdtitle('newEpisodes')||tr(p,'newEpisodes'),'zap',G,l.length?l:books,'newEpisodes');}if(k==='weeklyPopular'){const l=hlist('weeklyPopular');return section(hdtitle('weeklyPopular')||tr(p,'weeklyPopular'),'calendar',BL,l.length?l:(books.length?[...books].sort(byViews):[]),'weeklyPopular');}if(k==='monthlyPopular'){const l=hlist('monthlyPopular');return section(hdtitle('monthlyPopular')||tr(p,'monthlyPopular'),'star',PU,l.length?l:(books.length?[...books].sort(byViews):[]),'monthlyPopular');}if(k==='mostPopular'){const l=hlist('mostPopular');const list=l.length?l:(books.length?[...books].sort(byViews):[]);if(!list.length)return null;return <MostPopularCarousel books={list.slice(0,10)} theme={p.theme} lang={p.state.settings.language} accent={AU} onOpen={(id)=>p.open(id)} title={hdtitle('mostPopular')||'সর্বাধিক জনপ্রিয়'} onSeeAll={()=>p.setScreen({type:'list',title:'সর্বাধিক জনপ্রিয়',ids:list.map(x=>x.id)})} bookmarks={p.state.bookmarks} onUpdate={(ids)=>p.update({bookmarks:ids})} />;}return null;};return <Page theme={p.theme} onRefresh={doRefresh} refreshing={refreshing}><Header title={`${greet(p)}, ${p.state.name}`} sub={tr(p,'choose')} theme={p.theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/><Pressable onPress={()=>p.setScreen({type:'search'})} style={{backgroundColor:p.theme.card,borderRadius:14,borderWidth:1,borderColor:p.theme.line,flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingVertical:13,marginBottom:20,gap:10}}><Feather name="search" size={18} color={p.theme.muted}/><T style={{color:p.theme.muted,fontSize:14,fontWeight:'500',flex:1}}>বই, লেখক বা বিভাগ খুঁজুন</T></Pressable>{p.isOffline&&<OfflineBanner theme={p.theme} onRetry={()=>p.syncRemote?.()}/>}{!p.dataLoaded&&!books.length?<><View><View style={styles.secHead}><SkeletonPulse width={120} height={16} borderRadius={4}/></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{[1,2,3].map(i=><View key={i} style={{width:130}}><SkeletonPulse width={130} height={170} borderRadius={14}/><SkeletonPulse width={100} height={14} borderRadius={4} style={{marginTop:8}}/><SkeletonPulse width={80} height={11} borderRadius={3} style={{marginTop:6}}/></View>)}</ScrollView></View><View><View style={styles.secHead}><SkeletonPulse width={140} height={16} borderRadius={4}/></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{[1,2,3].map(i=><View key={i} style={{width:130}}><SkeletonPulse width={130} height={170} borderRadius={14}/><SkeletonPulse width={100} height={14} borderRadius={4} style={{marginTop:8}}/><SkeletonPulse width={80} height={11} borderRadius={3} style={{marginTop:6}}/></View>)}</ScrollView></View></>:<>{fixedSecs.map((s:any)=><React.Fragment key={s.key}>{renderFixed(s.key)}</React.Fragment>)}{catSecs.length>0&&catSecs.map((s:any)=>{const list=hlist(s.key);if(!list.length)return null;const c=s.color||'#4A1220';return <View key={s.key}><View style={styles.secHead}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={[styles.secIcon,{backgroundColor:shade(c,-30)}]}><Feather name={I(s.icon||'book-open')} size={13} color="#fff"/></View><T style={[styles.sectionTitle,{color:p.theme.ink}]}>{s.title}</T></View><Pressable onPress={()=>p.setScreen({type:'list',title:s.title,ids:list.map((x:any)=>x.id)})} style={[styles.seeAllPill,{backgroundColor:shade(c,-30)}]}><T style={{color:'#fff',fontWeight:'900',fontSize:12,letterSpacing:0.3}}>{tr(p,'seeAllText')}</T></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{list.map((b:Book,i:number)=><BookCard key={b.id} book={b} theme={p.theme} lang={p.state.settings.language} accent={c} section={s.key} onPress={()=>p.open(b.id)}/>)}</ScrollView></View>})}</>}</Page>}
const Home=React.memo(HomeInner);
function LibraryLink({title,icon,n,theme,onPress}:{title:string;icon:string;n:number;theme:Theme;onPress:()=>void}){const scale=React.useRef(new Animated.Value(1)).current;const pressIn=()=>{Animated.spring(scale,{toValue:0.96,useNativeDriver:true}).start()};const pressOut=()=>{Animated.spring(scale,{toValue:1,friction:3,tension:40,useNativeDriver:true}).start()};return <Animated.View style={{transform:[{scale}],width:'48.5%'}}><Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={{backgroundColor:theme.card,borderRadius:20,borderWidth:1,borderColor:theme.line,paddingVertical:20,paddingHorizontal:16,shadowColor:'#000',shadowOpacity:0.04,shadowRadius:10,shadowOffset:{width:0,height:2},elevation:2}}><View style={{width:44,height:44,borderRadius:14,backgroundColor:theme.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}><Feather name={I(icon)} size={20} color={theme.primary}/></View><T style={{fontSize:14,fontWeight:'800',color:theme.ink,marginBottom:4}}>{title}</T><T style={{color:theme.muted,fontSize:11,fontWeight:'600'}}>{n}টি</T></Pressable></Animated.View>}
function LibBookCard({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){const hideAll=book.hide_title_on_cover&&book.cover_url;return <Pressable onPress={onPress} style={{backgroundColor:theme.card,borderRadius:18,borderWidth:1,borderColor:theme.line,flexDirection:'row',alignItems:'center',padding:12,marginBottom:12,shadowColor:'#000',shadowOpacity:0.03,shadowRadius:8,shadowOffset:{width:0,height:2},elevation:2,gap:14}}><View style={{width:72,height:96,borderRadius:12,backgroundColor:book.color,overflow:'hidden',justifyContent:'flex-end',padding:hideAll?0:8}}>{book.cover_url?<Image source={{uri:book.cover_url}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:12}} resizeMode="cover"/>:null}{!hideAll&&book.cover_url&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:12,backgroundColor:'rgba(0,0,0,0.15)'}}/>}{!hideAll&&<T numberOfLines={2} style={{color:'#fff',fontWeight:'900',fontSize:10,lineHeight:13}}>{book.title}</T>}</View><View style={{flex:1}}><T numberOfLines={2} style={{fontSize:15,fontWeight:'800',color:theme.ink,lineHeight:20}}>{book.title}</T><T numberOfLines={1} style={{fontSize:12,fontWeight:'600',color:theme.primary,marginTop:5}}>{book.author}</T><View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:8}}><View style={{flexDirection:'row',alignItems:'center',gap:3}}><Feather name="eye" size={11} color={theme.muted}/><T style={{color:theme.muted,fontSize:11}}>{book.views_visible !== false ? book.views : ''}</T></View><View style={{width:3,height:3,borderRadius:1.5,backgroundColor:theme.muted,opacity:0.4}}/><T style={{color:theme.muted,fontSize:11}}>{book.category}</T></View></View><Feather name="chevron-right" size={18} color={theme.muted} style={{opacity:0.5}}/></Pressable>}
function Library(p:C){const[libTab,setLibTab]=React.useState<'downloads'|'favorites'|'history'|'bookmarks'>('downloads');const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;const theme=p.theme;const[refreshing,setRefreshing]=useState(false);const doRefresh=async()=>{if(!p.syncRemote)return;setRefreshing(true);try{await p.syncRemote()}catch{}finally{setRefreshing(false)}};const tabs:{key:'downloads'|'favorites'|'history'|'bookmarks';icon:string;label:string}[]=[{key:'downloads',icon:'download-cloud',label:tr(p,'downloads')},{key:'favorites',icon:'heart',label:tr(p,'favorites')},{key:'history',icon:'clock',label:tr(p,'history')},{key:'bookmarks',icon:'bookmark',label:tr(p,'bookmarks')}];const tabIdx=tabs.findIndex(x=>x.key===libTab);const slideAnim=React.useRef(new Animated.Value(tabIdx)).current;React.useEffect(()=>{Animated.timing(slideAnim,{toValue:tabIdx,duration:170,easing:Easing.bezier(0.25,0.1,0.25,1),useNativeDriver:true}).start()},[tabIdx]);const{width:sw}=useWindowDimensions();const pad=18;const contW=sw-pad*2;const inner=contW-8;const tabW=inner/4;const ids=libTab==='downloads'?p.state.downloads:libTab==='favorites'?p.state.favorites:libTab==='history'?p.state.history:p.state.bookmarks;return <Page theme={theme} onRefresh={doRefresh} refreshing={refreshing}><Header title={tr(p,'library')} sub={tr(p,'librarySub')} theme={theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/><View style={{backgroundColor:theme.card,borderRadius:16,borderWidth:1,borderColor:theme.line,marginBottom:24,shadowColor:'#000',shadowOpacity:0.03,shadowRadius:6,shadowOffset:{width:0,height:2},elevation:2,overflow:'hidden',flexDirection:'row',padding:4}}><Animated.View style={{position:'absolute',top:4,bottom:4,left:4,width:tabW,backgroundColor:theme.tint,borderRadius:12,transform:[{translateX:slideAnim.interpolate({inputRange:[0,1,2,3],outputRange:[0,tabW+4,tabW*2+8,tabW*3+12]})}]}}/>{tabs.map((t,i)=><Pressable key={t.key} onPress={()=>setLibTab(t.key)} style={{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:14,zIndex:1}}><Feather name={I(t.icon)} size={18} color={libTab===t.key?theme.primary:theme.muted}/>{libTab===t.key&&<T style={{fontSize:10,fontWeight:'800',color:theme.primary,marginTop:3}} numberOfLines={1}>{t.label}</T>}</Pressable>)}</View><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><T style={{fontSize:17,fontWeight:'900',color:theme.ink}}>{tabs[tabIdx].label}</T><View style={{backgroundColor:theme.tint,borderRadius:8,paddingHorizontal:10,paddingVertical:4}}><T style={{color:theme.primary,fontSize:11,fontWeight:'700'}}>{ids.length}টি</T></View></View>{ids.length?ids.map(id=>{const b=p.allBooks.find(x=>x.id===id)||p.dlBooks[id];return b&&<LibBookCard key={id} book={b} theme={theme} onPress={()=>p.open(id)}/> }):<Empty theme={theme}/>}</Page>}
function Categories(p:C){const theme=p.theme;const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;const[refreshing,setRefreshing]=useState(false);const doRefresh=async()=>{if(!p.syncRemote)return;setRefreshing(true);try{await p.syncRemote()}catch{}finally{setRefreshing(false)}};const skeletonColors=['#2AA876','#E85D75','#8B5CF6','#D97706','#3B82F6','#EC4899','#0891B2','#DC2626','#059669'];return <Page theme={theme} onRefresh={doRefresh} refreshing={refreshing}><Header title={tr(p,'categories')} sub={tr(p,'categoriesSub')} theme={theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/>{!p.dataLoaded&&!p.allCategories.length?<View style={styles.catGrid}>{skeletonColors.map((c,i)=><View key={i} style={[styles.catCard,{opacity:0.6}]}><View style={[styles.catImgWrap]}><SkeletonPulse width="100%" height={120} borderRadius={0} style={{backgroundColor:c+'44'}}/></View></View>)}</View>:!p.allCategories.length?<Empty theme={theme}/>:<View style={styles.catGrid}>{p.allCategories.map(c=>{const count=p.allBooks.filter(b=>b.category===c[0]).length;const hasImg=Boolean(c[3]);const bookWord=count===1?copy(p.state.settings.language,'book'):copy(p.state.settings.language,'books');return <Pressable key={c[0]} onPress={()=>p.setScreen({type:'list',title:c[0],ids:p.allBooks.filter(b=>b.category===c[0]).map(b=>b.id)})} style={styles.catCard}><View style={[styles.catImgWrap]}>{hasImg?<Image source={{uri:c[3]!}} style={styles.catImg}/>:<View style={[styles.catImgFallback,{backgroundColor:c[2]}]}><T style={{color:'#fff',fontSize:28,fontWeight:'900',opacity:0.5}}>{c[0][0]}</T></View>}<View style={styles.catImgOverlay}><T numberOfLines={1} style={styles.catImgName}>{c[0]}</T></View></View><View style={[styles.catBadge,{backgroundColor:theme.tint}]}><T style={[styles.catBadgeText,{color:theme.primary}]}>{count} {bookWord}</T></View></Pressable>})}</View>}</Page>}
function Episodes(p:C){const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;const[refreshing,setRefreshing]=useState(false);const doRefresh=async()=>{if(!p.syncRemote)return;setRefreshing(true);try{await p.syncRemote()}catch{}finally{setRefreshing(false)}};return <Page theme={p.theme} onRefresh={doRefresh} refreshing={refreshing}><Header title={tr(p,'episodes')} sub={tr(p,'episodesSub')} theme={p.theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/>{p.allBooks.map((b,i)=><Episode key={b.id} book={b} theme={p.theme} onPress={()=>p.read(b.id,b.chapters.length?(i+2)%b.chapters.length:0)}/>)}</Page>}
function Profile(p:C){
  const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;
  const t=p.theme;
  const favs=p.state.favorites.length,downs=p.state.downloads.length,hist=p.state.history.length;
  const lang=p.state.settings.language;

  const cardFade1=useRef(new Animated.Value(0)).current;
  const cardFade2=useRef(new Animated.Value(0)).current;
  const streakDots=[useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current];
  const weekBars=[useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current];
  const counterVal=useRef(new Animated.Value(0)).current;
  const[counterDisplay,setCounterDisplay]=useState(0);

  useEffect(()=>{
    Animated.stagger(120,[Animated.parallel([
      Animated.timing(cardFade1,{toValue:1,duration:500,useNativeDriver:true}),
      ...streakDots.map((d,i)=>Animated.spring(d,{toValue:1,delay:400+i*60,friction:6,useNativeDriver:true}))
    ]),Animated.parallel([
      Animated.timing(cardFade2,{toValue:1,duration:500,useNativeDriver:true}),
      ...weekBars.map((b,i)=>Animated.spring(b,{toValue:1,delay:500+i*80,friction:6,useNativeDriver:true}))
    ])]).start();
    const days=calcStreak(p.state.readingActivity);
    counterVal.setValue(counterDisplay);
    Animated.timing(counterVal,{toValue:days,duration:800,useNativeDriver:false}).start();
    counterVal.removeAllListeners();
    counterVal.addListener(({value})=>setCounterDisplay(Math.round(value)));
    return ()=>counterVal.removeAllListeners();
  },[p.state.readingActivity]);

  const streak=calcStreak(p.state.readingActivity);
  const weekMins=calcWeekMins(p.state.readingActivity);
  const weekEps=calcWeekEps(p.state.readingActivity);
  const getDayLabels=(l:Language)=>{
    const bn=['শনি','রবি','সোম','মঙ্ল','বুধ','বৃহ','শুক্র'];
    const en=['Sat','Sun','Mon','Tue','Wed','Thu','Fri'];
    const hi=['शनि','रवि','सोम','मंगल','बुध','बृह','शुक्र'];
    const arr=l==='bn'?bn:l==='hi'?hi:en;
    const today=new Date().getDay();
    const base=today===6?0:today+1;
    return Array.from({length:7},(_,i)=>arr[(base+i)%7]);
  };
  const dayLabels=getDayLabels(lang);
  const maxBar=Math.max(1,...[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()-6+i);return p.state.readingActivity[d.toISOString().slice(0,10)]?.minutes||0}));

  return <Page theme={t}>
    <Header title={tr(p,'menu')} theme={t} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/>
    <ScrollView showsVerticalScrollIndicator={false}>
    <Pressable onPress={()=>p.setScreen({type:'profileDetails'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      {(p.state.writer?.avatar_url||p.state.user?.avatar_url)?<Image source={{uri:p.state.writer?.avatar_url||p.state.user?.avatar_url}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <T style={{fontSize:18,fontWeight:'900',color:t.primary}}>{(p.state.user?.display_name||p.state.writer?.writer_name||p.state.name||'?')[0]?.toUpperCase()}</T>
      </View>}
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{p.state.user?.display_name||p.state.writer?.writer_name||p.state.name}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.writer?tr(p,'writerStudio'):tr(p,'regularReader')}</T>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    {/* === READING STREAK CARD === */}
    <Animated.View style={{opacity:cardFade1,transform:[{translateY:cardFade1.interpolate({inputRange:[0,1],outputRange:[12,0]})}],backgroundColor:t.tint,borderRadius:14,paddingHorizontal:12,paddingTop:10,paddingBottom:10,marginBottom:8,borderWidth:1,borderColor:t.line,shadowColor:t.primary,shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:6,elevation:2}}>
      <View style={{flexDirection:'row',alignItems:'center'}}>
        <View style={{width:34,height:34,borderRadius:10,backgroundColor:t.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}>
          <Feather name="zap" size={16} color={t.primary}/>
        </View>
        <View style={{flex:1,marginLeft:10}}>
          <T style={{fontSize:13,fontWeight:'800',color:t.ink}}>{tr(p,'readingStreak')}</T>
          <T style={{fontSize:10,color:t.muted,marginTop:1}}>{tr(p,'keepItUp')}</T>
        </View>
        <View style={{alignItems:'center',backgroundColor:t.card,borderRadius:10,paddingHorizontal:10,paddingVertical:5,borderWidth:1,borderColor:t.line}}>
          <Animated.Text style={{fontSize:20,fontWeight:'900',color:t.primary}}>{counterDisplay}</Animated.Text>
          <T style={{fontSize:8,fontWeight:'800',color:t.muted,marginTop:-2}}>{tr(p,'days')}</T>
        </View>
      </View>
      <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:10,paddingHorizontal:2}}>
        {[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const active=Boolean(p.state.readingActivity[k]?.episodes);const today=new Date().toISOString().slice(0,10);const isToday=k===today;return <Animated.View key={i} style={{alignItems:'center',gap:4,transform:[{scale:streakDots[i]}]}}>
          <View style={{width:24,height:24,borderRadius:12,backgroundColor:active?t.primary:isToday?t.card:`${t.primary}11`,alignItems:'center',justifyContent:'center',borderWidth:isToday?2:0,borderColor:isToday?t.primary:'transparent'}}>
            {active?<Feather name="check" size={10} color="#fff"/>:isToday&&<View style={{width:5,height:5,borderRadius:3,backgroundColor:t.primary}}/>}
          </View>
          <T style={{fontSize:8,fontWeight:isToday?'800':'600',color:isToday?t.ink:t.muted}}>{dayLabels[i]}</T>
        </Animated.View>})}
      </View>
    </Animated.View>

    {/* === WEEKLY READING CARD — compact analytics === */}
    <Animated.View style={{opacity:cardFade2,transform:[{translateY:cardFade2.interpolate({inputRange:[0,1],outputRange:[10,0]})}],backgroundColor:t.card,borderRadius:12,paddingHorizontal:12,paddingTop:10,paddingBottom:10,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
        <Feather name="bar-chart-2" size={12} color={t.primary}/>
        <T style={{fontSize:11,fontWeight:'800',color:t.ink,marginLeft:6}}>{tr(p,'yourReading')}</T>
        <T style={{fontSize:9,color:t.muted,marginLeft:'auto'}}>{tr(p,'weekSummary')}</T>
      </View>
      <View style={{flexDirection:'row',gap:6,marginBottom:8}}>
        <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:`${t.primary}08`,borderRadius:8,paddingHorizontal:10,paddingVertical:6}}>
          <Feather name="clock" size={12} color={t.primary}/>
          <View>
            <T style={{fontSize:15,fontWeight:'900',color:t.primary,lineHeight:17}}>{weekMins>=60?`${Math.floor(weekMins/60)}:${String(weekMins%60).padStart(2,'0')}`:weekMins}</T>
            <T style={{fontSize:8,fontWeight:'600',color:t.muted}}>{weekMins>=60?(p.state.settings.language==='bn'?'ঘন্টা পড়া হয়েছে':p.state.settings.language==='hi'?'घंटे पढ़े':copy(p.state.settings.language,'minRead')):copy(p.state.settings.language,'minRead')}</T>
          </View>
        </View>
        <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:`${t.primary}08`,borderRadius:8,paddingHorizontal:10,paddingVertical:6}}>
          <Feather name="book-open" size={12} color={t.primary}/>
          <View>
            <T style={{fontSize:15,fontWeight:'900',color:t.primary,lineHeight:17}}>{weekEps}</T>
            <T style={{fontSize:8,fontWeight:'600',color:t.muted}}>{tr(p,'episodesDone')}</T>
          </View>
        </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',height:30,paddingHorizontal:1}}>
        {[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const m=p.state.readingActivity[k]?.minutes||0;const h=Math.max(2,Math.round(m/maxBar*24));const today=new Date().toISOString().slice(0,10);const isToday=k===today;return <Animated.View key={i} style={{alignItems:'center',flex:1,justifyContent:'flex-end',gap:2,transform:[{scaleY:weekBars[i]}]}}>
          <View style={{width:'55%',height:h,backgroundColor:m?t.primary:isToday?`${t.primary}15`:`${t.primary}08`,borderRadius:2,minHeight:2}}/>
          <T style={{fontSize:7,fontWeight:isToday?'800':'500',color:isToday?t.primary:t.muted}}>{dayLabels[i]}</T>
        </Animated.View>})}
      </View>
    </Animated.View>

    <Pressable onPress={()=>p.setScreen({type:'writer'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
      {p.state.writer?.avatar_url?<Image source={{uri:p.state.writer.avatar_url}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:p.state.writer?t.primary:t.tint,alignItems:'center',justifyContent:'center'}}>
        {p.state.writer?<T style={{fontSize:18,fontWeight:'900',color:'#fff'}}>{p.state.writer.writer_name?.[0]?.toUpperCase()||'?'}</T>:<Feather name="edit-3" size={18} color={t.primary}/>}
      </View>}
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{p.state.writer?p.state.writer.writer_name||tr(p,'writer'):tr(p,'writer')}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.writer?tr(p,'writerStudio'):tr(p,'writerStudioSub')}</T>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Pressable onPress={()=>p.setScreen({type:'followedWriters'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="users" size={18} color={t.primary}/>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{tr(p,'followedWriters')}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:1}}>{(p.state.followedWriters||[]).length} {tr(p,'writers')}</T>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Pressable onPress={()=>p.setScreen({type:'settings'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="settings" size={18} color={t.primary}/>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{tr(p,'settings')}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:1}}>{tr(p,'theme')}, {tr(p,'language')}</T>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Pressable onPress={()=>p.setScreen({type:'guide'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:'#FEF3C7',alignItems:'center',justifyContent:'center'}}>
        <Feather name="book-open" size={18} color="#D97706"/>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{tr(p,'guideTitle')}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:1}}>{tr(p,'guideSub')}</T>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <T style={[styles.menuGroupTitle,{color:t.muted}]}>{tr(p,'aboutApp')}</T>
    <View style={[styles.menuGroup,{backgroundColor:t.card}]}>
      <Menu title={tr(p,'aboutApp')} icon="info" theme={t} onPress={()=>p.setScreen({type:'aboutApp'})}/>
      <Menu title={tr(p,'termsOfService')} icon="file-text" theme={t} onPress={()=>p.setScreen({type:'terms'})}/>
      <Menu title={tr(p,'shareApp')} icon="share-2" theme={t} onPress={()=>Share.share({message:'Lekhoni Kahini - Bengali stories app'})}/>
      <Menu title={tr(p,'rateApp')} icon="star" theme={t} onPress={()=>Alert.alert(tr(p,'rateApp'),tr(p,'appDesc'))}/>
    </View>
    </ScrollView>
  </Page>}

function calcStreak(a:Record<string,{minutes:number;episodes:number}>):number{let s=0;const today=new Date();for(let i=0;i<365;i++){const d=new Date(today);d.setDate(d.getDate()-i);if(a[d.toISOString().slice(0,10)]?.episodes)s++;else break}return s}
function calcWeekMins(a:Record<string,{minutes:number;episodes:number}>):number{let t2=0;const today=new Date();for(let i=0;i<7;i++){const d=new Date(today);d.setDate(d.getDate()-6+i);t2+=a[d.toISOString().slice(0,10)]?.minutes||0}return t2}
function calcWeekEps(a:Record<string,{minutes:number;episodes:number}>):number{let t2=0;const today=new Date();for(let i=0;i<7;i++){const d=new Date(today);d.setDate(d.getDate()-6+i);t2+=a[d.toISOString().slice(0,10)]?.episodes||0}return t2}

function ProfileDetails(p:C){
  const t=p.theme;
  const lang=p.state.settings.language;
  const favs=p.state.favorites.length;
  const downs=p.state.downloads.length;
  const hist=p.state.history.length;
  const favBooks=p.state.favorites.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const downBooks=p.state.downloads.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const histBooks=p.state.history.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const [editing,setEditing]=useState(false);
  const [nameInput,setNameInput]=useState(p.state.name);

  const isLoggedInAsWriter=!!p.state.writer;
  const isLoggedIn=isLoggedInAsWriter;

  const profileName=p.state.writer?.writer_name||p.state.name;
  const profileUsername=p.state.writer?.username;
  const profileAvatar=p.state.writer?.avatar_url;
  const isWriter=isLoggedInAsWriter;

  const sections:{title:string;icon:string;count:number;books:Book[];ids:string[]}[]=[
    {title:tr(p,'favorites'),icon:'heart',count:favs,books:favBooks,ids:p.state.favorites},
    {title:tr(p,'downloads'),icon:'download',count:downs,books:downBooks,ids:p.state.downloads},
    {title:tr(p,'history'),icon:'clock',count:hist,books:histBooks,ids:p.state.history},
  ];

  const logout=()=>{
    if(p.state.writer){p.update({writer:null,writerToken:null,followedWriters:[]})}
  };

  const titleText=isWriter?(lang==='hi'?'लेखक प्रोफ़ाइল':lang==='en'?'Writer Profile':'লেখক প্রোফাইল'):(isLoggedIn?(lang==='hi'?'नियमित पाठक':lang==='en'?'Regular Reader':'নিয়মিত পাঠক'):tr(p,'guestReader'));

  return <Page theme={t}>
    <Back title={titleText} theme={t} onPress={()=>p.goBack()}/>
    {p.isOffline&&<OfflineBanner theme={t} onRetry={()=>p.syncRemote?.()}/>}
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[styles.profileCard,{backgroundColor:t.card}]}>
        {profileAvatar?<Image source={{uri:profileAvatar}} style={{width:56,height:56,borderRadius:28,marginBottom:8}}/>:<View style={[styles.avatarBig,{backgroundColor:t.tint}]}><T style={{fontSize:28,fontWeight:'900',color:t.primary}}>{(profileName)[0]?.toUpperCase()||'?'}</T></View>}
        <T style={[styles.profileNameBig,{color:t.ink}]}>{profileName}</T>
        <T style={[styles.profileBadge,{color:t.muted}]}>{isLoggedInAsWriter?`@${profileUsername||''}`:tr(p,'regularReader')}</T>
        {isLoggedIn&&<Pressable onPress={logout} style={{marginTop:6,paddingHorizontal:12,paddingVertical:6,borderRadius:8,borderWidth:1,borderColor:'#EF4444'}}>
          <T style={{fontSize:11,fontWeight:'700',color:'#EF4444'}}>{lang==='hi'?'लॉग आउट':lang==='en'?'Logout':'লগআউট'}</T>
        </Pressable>}
        {!isLoggedIn&&!isWriter&&<Pressable onPress={()=>p.setScreen({type:'writer'})} style={{marginTop:6,paddingHorizontal:16,paddingVertical:8,borderRadius:10,backgroundColor:t.primary}}>
          <T style={{fontSize:12,fontWeight:'700',color:'#fff'}}>{lang==='hi'?'लॉग इन / साइन अप':lang==='en'?'Login / Sign Up':'লগইন / সাইনআপ'}</T>
        </Pressable>}
        <View style={[styles.profileStats,{backgroundColor:t.bg}]}>
          <View style={styles.profileStat}><T style={[styles.profileStatNum,{color:t.primary}]}>{favs}</T><T style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'favorites')}</T></View>
          <View style={[styles.profileStat,{borderLeftWidth:1,borderLeftColor:t.line}]}><T style={[styles.profileStatNum,{color:t.primary}]}>{downs}</T><T style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'downloads')}</T></View>
          <View style={[styles.profileStat,{borderLeftWidth:1,borderLeftColor:t.line}]}><T style={[styles.profileStatNum,{color:t.primary}]}>{hist}</T><T style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'history')}</T></View>
        </View>
        {isLoggedInAsWriter&&<Pressable onPress={()=>{setNameInput(p.state.writer?.writer_name||p.state.name);setEditing(true)}} style={{marginTop:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:t.tint,borderRadius:12,paddingHorizontal:14,paddingVertical:8}}>
          <Feather name="edit-2" size={14} color={t.primary}/><T style={{color:t.primary,fontWeight:'800',fontSize:13}}>{tr(p,'editName')}</T>
        </Pressable>}
      </View>

      {sections.map((sec,idx)=><Pressable key={idx} onPress={()=>{if(sec.ids.length)p.setScreen({type:'list',title:sec.title,ids:sec.ids})}} style={[styles.menuGroup,{backgroundColor:t.card,marginBottom:10}]}>
        <View style={{flexDirection:'row',alignItems:'center',paddingVertical:14,paddingHorizontal:16}}>
          <View style={{width:36,height:36,borderRadius:10,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
            <Feather name={sec.icon as any} size={17} color={t.primary}/>
          </View>
          <View style={{flex:1,marginLeft:12}}>
            <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>{sec.title}</T>
            <T style={{fontSize:11,color:t.muted,marginTop:1}}>{sec.count} {tr(p,'books')}</T>
          </View>
          <Feather name="chevron-right" size={18} color={t.muted}/>
        </View>
      </Pressable>)}
    </ScrollView>
  </Page>}

function AuthModal({theme,lang,onClose,onGoto}:{theme:Theme;lang:import('./src/types').Language;onClose:()=>void;onGoto:()=>void}){
  const tl=lang==='hi'?'खाता नहीं बना है':lang==='en'?'Account Not Created':'অ্যাকাউন্ট খোলা হয়নি';
  const bd=lang==='hi'?'आपका खाता अभी तक नहीं बना है। आप किसी को फ़ॉलो नहीं कर सकते और कोई आपको फ़ॉलो नहीं कर सकता।':lang==='en'?'Your account is not created yet. You cannot follow anyone or be followed by anyone.':'আপনার অ্যাকাউন্ট এখনো খোলা হয়নি। আপনি কাউকে ফলো করতে বা কেউ আপনাকে ফলো করতে পারবে না।';
  const bt=lang==='hi'?'लेखक पैनल में जाएं':lang==='en'?'Go to Writer Panel':'লেখক প্যানেলে যান';
  const cn=lang==='hi'?'रद्द करें':lang==='en'?'Cancel':'বাতিল';
  return <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24}}>
    <View style={{width:'100%',backgroundColor:theme.card,borderRadius:22,padding:24,alignItems:'center'}}>
      <View style={{width:56,height:56,borderRadius:28,backgroundColor:theme.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}><Feather name="user-plus" size={24} color={theme.primary}/></View>
      <T style={{fontSize:17,fontWeight:'900',color:theme.ink,marginBottom:6,textAlign:'center'}}>{tl}</T>
      <T style={{fontSize:13,color:theme.muted,textAlign:'center',lineHeight:20,marginBottom:18}}>{bd}</T>
      <Pressable onPress={()=>{onClose();onGoto()}} style={{width:'100%',height:48,borderRadius:14,backgroundColor:theme.primary,alignItems:'center',justifyContent:'center',marginBottom:10}}>
        <T style={{fontSize:14,fontWeight:'800',color:'#fff'}}>{bt}</T>
      </Pressable>
      <Pressable onPress={onClose} style={{paddingVertical:8}}>
        <T style={{fontSize:13,fontWeight:'700',color:theme.muted}}>{cn}</T>
      </Pressable>
    </View>
  </View>;
}

function AllWritersList(p:C){
  const t=p.theme;
  const [q,setQ]=useState('');
  const [showAuth,setShowAuth]=useState(false);
  const followLog=useRef<Record<string,number[]>>({});
  const followedIds=new Set((p.state.followedWriters||[]).map(f=>f.id));
  const unfollowed=p.publicWriters.filter(w=>!followedIds.has(w.id));
  const filtered=q.trim()?unfollowed.filter(w=>`${w.writer_name} ${w.username}`.toLowerCase().includes(q.trim().toLowerCase())):unfollowed;
  const toggleFollow=async(w:import('./src/types').WriterProfile)=>{
    if(!p.state.writer&&!p.state.user){setShowAuth(true);return;}
    const now=Date.now();
    const log=followLog.current[w.id]||[];
    const recent=log.filter(t=>now-t<60000);
    if(recent.length>=4){Alert.alert(copy(p.state.settings.language,'reportSpam'),p.state.settings.language==='bn'?'অনুগ্রহ করে ১ মিনিট অপেক্ষা করুন।':p.state.settings.language==='hi'?'कृपया 1 मिनट प्रतीक्षा करें।':'Please wait 1 minute.');return;}
    followLog.current[w.id]=[...recent,now];
    const isFollowed=p.state.followedWriters.some(x=>x.id===w.id);
    if(isFollowed){
      p.update({followedWriters:p.state.followedWriters.filter(x=>x.id!==w.id)});
      const ok=await unfollowWriter(p.state.deviceId,w.id);
      if(!ok)p.update({followedWriters:[...p.state.followedWriters,w]});
    }else{
      p.update({followedWriters:[...p.state.followedWriters,w]});
      const ok=await followWriter(p.state.deviceId,w.id,p.state.writer?.id,p.state.user?.id);
      if(!ok)p.update({followedWriters:p.state.followedWriters.filter(x=>x.id!==w.id)});
    }
  };
  return <Page theme={t}>
    <Back title={tr(p,'popularAuthors')} theme={t} onPress={()=>p.goBack()}/>
    {p.isOffline&&<OfflineBanner theme={t} onRetry={()=>p.syncRemote?.()}/>}
    <View style={{height:50,borderWidth:1,borderRadius:14,paddingHorizontal:14,marginBottom:16,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:t.card,borderColor:t.line}}>
      <Feather name="search" size={17} color={t.muted}/>
      <TextInput value={q} onChangeText={setQ} placeholder={copy(p.state.settings.language,'search')} placeholderTextColor={t.muted+'88'} style={{flex:1,color:t.ink,fontSize:14,fontFamily:GF()}}/>
      {q.length>0&&<Pressable onPress={()=>setQ('')} hitSlop={8}><Feather name="x" size={16} color={t.muted}/></Pressable>}
    </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:30}}>
      {filtered.length===0?
        <View style={{alignItems:'center',paddingVertical:60}}>
          <View style={{width:60,height:60,borderRadius:30,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}>
            <Feather name="users" size={26} color={t.muted}/>
          </View>
          <T style={{fontSize:14,fontWeight:'700',color:t.muted,textAlign:'center'}}>{tr(p,'noFollowedWriters')}</T>
        </View>
      :filtered.map(w=>{
        const isFollowed=p.state.followedWriters.some(x=>x.id===w.id);
        return <Pressable key={w.id} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
          <View style={{width:48,height:48,borderRadius:24,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
            {w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:48,height:48,borderRadius:24}}/>:<T style={{fontSize:20,fontWeight:'900',color:t.primary}}>{w.writer_name[0]?.toUpperCase()||'?'}</T>}
          </View>
          <View style={{flex:1,marginLeft:12}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
              <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{w.writer_name}</T>
              <BadgeIcon badge={w.badge} size={16}/>
            </View>
            <T numberOfLines={1} style={{fontSize:12,color:t.muted,marginTop:2}}>@{w.username}</T>
          </View>
          <Pressable onPress={(e)=>{e.stopPropagation();toggleFollow(w)}} hitSlop={8} style={{paddingHorizontal:14,paddingVertical:8,borderRadius:10,backgroundColor:isFollowed?'transparent':t.primary,borderWidth:isFollowed?1.5:0,borderColor:t.line}}>
            <T style={{fontSize:12,fontWeight:'700',color:isFollowed?t.ink:'#fff'}}>{isFollowed?'ফলো করছেন':'ফলো করুন'}</T>
          </Pressable>
        </Pressable>})}
    </ScrollView>
    {showAuth&&<AuthModal theme={t} lang={p.state.settings.language} onClose={()=>setShowAuth(false)} onGoto={()=>p.setScreen({type:'writer'})}/>}
  </Page>
}

function FollowedWritersList(p:C){
  const t=p.theme;
  const [showAuth,setShowAuth]=useState(false);
  const writers=p.state.followedWriters||[];
  const followLog=useRef<Record<string,number[]>>({});
  const toggleFollow=async(wid:string)=>{
    if(!p.state.writer){setShowAuth(true);return;}
    const now=Date.now();
    const log=followLog.current[wid]||[];
    const recent=log.filter(t=>now-t<60000);
    if(recent.length>=4){Alert.alert(copy(p.state.settings.language,'reportSpam'),p.state.settings.language==='bn'?'অনুগ্রহ করে ১ মিনিট অপেক্ষা করুন।':p.state.settings.language==='hi'?'कृपया 1 मिनट प्रतीक्षा करें।':'Please wait 1 minute.');return;}
    followLog.current[wid]=[...recent,now];
    const fw=p.state.followedWriters||[];
    const isFollowed=fw.some(w=>w.id===wid);
    if(isFollowed){
      p.update({followedWriters:fw.filter(w=>w.id!==wid)});
      const ok=await unfollowWriter(p.state.deviceId,wid);
      if(!ok)p.update({followedWriters:[...fw,writers.find(x=>x.id===wid)!].filter(Boolean)});
    }else{
      const w=p.publicWriters.find(x=>x.id===wid)||writers.find(x=>x.id===wid);
      if(w){
        p.update({followedWriters:[...fw,w]});
        const ok=await followWriter(p.state.deviceId,wid,p.state.writer?.id);
        if(!ok)p.update({followedWriters:fw.filter(x=>x.id!==wid)});
      }
    }
  };
  return <Page theme={t}>
    <Back title={tr(p,'followedWriters')} theme={t} onPress={()=>p.goBack()}/>
    {p.isOffline&&<OfflineBanner theme={t} onRetry={()=>p.syncRemote?.()}/>}
    {writers.length===0?
      <View style={{alignItems:'center',paddingVertical:60}}>
        <View style={{width:60,height:60,borderRadius:30,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}>
          <Feather name="users" size={26} color={t.muted}/>
        </View>
        <T style={{fontSize:14,fontWeight:'700',color:t.muted,textAlign:'center'}}>{tr(p,'noFollowedWriters')}</T>
      </View>
    :<ScrollView showsVerticalScrollIndicator={false}>
      {writers.map(w=><Pressable key={w.id} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
        {w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:44,height:44,borderRadius:22}}/>:<View style={{width:44,height:44,borderRadius:22,backgroundColor:t.primary,alignItems:'center',justifyContent:'center'}}>
          <T style={{fontSize:18,fontWeight:'900',color:'#fff'}}>{w.writer_name[0]?.toUpperCase()||'?'}</T>
        </View>}
        <View style={{flex:1,marginLeft:12}}>
          <T numberOfLines={1} style={{fontSize:14,fontWeight:'800',color:t.ink}}>{w.writer_name} <BadgeIcon badge={w.badge} size={14}/></T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>@{w.username}{w.follower_count?` · ${w.follower_count} ${tr(p,'followers')}`:''}</T>
        </View>
        <Pressable onPress={()=>toggleFollow(w.id)} style={{paddingHorizontal:14,paddingVertical:7,borderRadius:10,backgroundColor:t.tint}}>
          <T style={{fontSize:12,fontWeight:'800',color:t.primary}}>{tr(p,'unfollow')}</T>
        </Pressable>
      </Pressable>)}
    </ScrollView>}
    {showAuth&&<AuthModal theme={t} lang={p.state.settings.language} onClose={()=>setShowAuth(false)} onGoto={()=>p.setScreen({type:'writer'})}/>}
  </Page>}

function WriterProfileView(p:C&{writer:import('./src/types').WriterProfile}){
  const t=p.theme;const w=p.writer;
  const isFollowed=p.state.followedWriters.some(x=>x.id===w.id);
  const writerBooks=p.allBooks.filter(b=>b.author===w.writer_name);
  const published=writerBooks.length;
  const [liveTotalReads,setLiveTotalReads]=useState(writerBooks.reduce((s,b)=>s+(Math.round(parseFloat(String(b.views).replace(/[^0-9.]/g,''))||0)),0));
  useEffect(()=>{const sum=writerBooks.reduce((s,b)=>s+(Math.round(parseFloat(String(b.views).replace(/[^0-9.]/g,''))||0)),0);setLiveTotalReads(sum);},[writerBooks.length]);
  useEffect(()=>{fetch('https://lekhoni-admin-api.smdkawsar2.workers.dev/api/public/books').then(r=>r.json()).then((books:any)=>{const fresh=books.filter((b:any)=>b.author===w.writer_name);const sum=fresh.reduce((s:number,b:any)=>s+(b.views||0),0);if(sum>0)setLiveTotalReads(sum);}).catch(()=>{});},[]);
  const[phase,setPhase]=useState<'idle'|'spinning'|'followed'>(isFollowed?'followed':'idle');
  const[showAuth,setShowAuth]=useState(false);
  const spin=useRef(new Animated.Value(0)).current;
  const followLog=useRef<Record<string,number[]>>({});
  const [liveFollowers,setLiveFollowers]=useState(w.follower_count||0);
  useEffect(()=>{setLiveFollowers(w.follower_count||0);fetch('https://lekhoni-admin-api.smdkawsar2.workers.dev/api/public/writers').then(r=>r.json()).then((writers:any)=>{const fw=writers.find((x:any)=>x.id===w.id);if(fw)setLiveFollowers(fw.follower_count||0);}).catch(()=>{});},[w.id,w.follower_count]);
  useEffect(()=>{setPhase(isFollowed?'followed':'idle')},[isFollowed]);
  const doFollow=async()=>{
    if(!p.state.writer&&!p.state.user){setShowAuth(true);return;}
    const now=Date.now();const log=followLog.current[w.id]||[];const recent=log.filter(t=>now-t<60000);
    if(recent.length>=4){Alert.alert(copy(p.state.settings.language,'reportSpam'),p.state.settings.language==='bn'?'অনুগ্রহ করে ১ মিনিট অপেক্ষা করুন।':p.state.settings.language==='hi'?'कृपया 1 मिनट प्रतीक्षा करें।':'Please wait 1 minute.');return;}
    followLog.current[w.id]=[...recent,now];
    setPhase('spinning');
    setLiveFollowers(prev=>prev+1);
    spin.setValue(0);
    Animated.timing(spin,{toValue:1,duration:1500,easing:Easing.linear,useNativeDriver:true}).start();
    p.update({followedWriters:[...p.state.followedWriters,w]});
    const ok=await followWriter(p.state.deviceId,w.id,p.state.writer?.id,p.state.user?.id);
    setTimeout(()=>{spin.stopAnimation();spin.setValue(0);setPhase(ok?'followed':'idle')},1800);
    if(!ok){p.update({followedWriters:p.state.followedWriters.filter(x=>x.id!==w.id)});setLiveFollowers(prev=>Math.max(0,prev-1));}
  };
  const doUnfollow=async()=>{
    setLiveFollowers(prev=>Math.max(0,prev-1));
    p.update({followedWriters:p.state.followedWriters.filter(x=>x.id!==w.id)});
    setPhase('idle');
    const ok=await unfollowWriter(p.state.deviceId,w.id);
    if(!ok){p.update({followedWriters:[...p.state.followedWriters,w]});setPhase('followed');setLiveFollowers(prev=>prev+1);}
  };
  const spinDeg=spin.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  return <Page theme={t}>
    <Back title={tr(p,'writer')} theme={t} onPress={()=>p.goBack()}/>
    {p.isOffline&&<OfflineBanner theme={t} onRetry={()=>p.syncRemote?.()}/>}
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:30}}>
      <View style={{alignItems:'center',paddingTop:10,marginBottom:20}}>
        {w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:100,height:100,borderRadius:24,backgroundColor:t.tint}}/>:<View style={{width:100,height:100,borderRadius:24,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:40,fontWeight:'900',color:t.primary}}>{w.writer_name[0]?.toUpperCase()||'?'}</T></View>}
        <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
          <T style={{fontSize:22,fontWeight:'900',color:t.ink}}>{w.writer_name}</T>
          <BadgeIcon badge={w.badge} size={22}/>
        </View>
        <T style={{fontSize:13,fontWeight:'500',color:t.muted,marginTop:3}}>@{w.username}</T>
        {w.bio&&<T style={{fontSize:13,color:t.muted,marginTop:8,textAlign:'center',lineHeight:20,maxWidth:300}}>{w.bio}</T>}
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:16,marginBottom:16,gap:0}}>
  <View style={{alignItems:'center',flex:1}}><T style={{fontSize:22,fontWeight:'900',color:t.ink}}>{published}</T><T style={{fontSize:10,fontWeight:'700',color:t.muted,marginTop:2}}>প্রকাশিত</T></View>
  <View style={{width:1, height:36, backgroundColor:t.line}}/>
  <View style={{alignItems:'center',flex:1}}><T style={{fontSize:22,fontWeight:'900',color:t.ink}}>{liveTotalReads}</T><T style={{fontSize:10,fontWeight:'700',color:t.muted,marginTop:2}}>মোট পাঠ</T></View>
  <View style={{width:1, height:36, backgroundColor:t.line}}/>
  <View style={{alignItems:'center',flex:1}}><T style={{fontSize:22,fontWeight:'900',color:t.ink}}>{liveFollowers}</T><T style={{fontSize:10,fontWeight:'700',color:t.muted,marginTop:2}}>অনুসারী</T></View>
</View>
      {phase==='spinning'?<View style={{marginHorizontal:16,height:48,borderRadius:14,backgroundColor:t.tint,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginBottom:6}}>
        <Animated.View style={{transform:[{rotate:spinDeg}]}}><Feather name="loader" size={16} color={t.primary}/></Animated.View>
        <T style={{fontSize:14,fontWeight:'800',color:t.primary}}>{tr(p,'follow')}</T>
      </View>:<Pressable onPress={phase==='followed'?doUnfollow:doFollow} style={{marginHorizontal:16,height:48,borderRadius:14,backgroundColor:phase==='followed'?t.bg:t.primary,borderWidth:phase==='followed'?1.5:0,borderColor:t.line,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginBottom:6}}>
        <Feather name={phase==='followed'?'user-check':'user-plus'} size={16} color={phase==='followed'?t.ink:'#fff'}/>
        <T style={{fontSize:14,fontWeight:'800',color:phase==='followed'?t.ink:'#fff'}}>{phase==='followed'?'ফলো করছেন':tr(p,'follow')}</T>
      </Pressable>}
      <T style={{fontSize:11,color:t.muted,textAlign:'center',marginBottom:20,lineHeight:17,paddingHorizontal:28}}>{tr(p,'followHint')}</T>
      {writerBooks.length>0&&<>
        <View style={{flexDirection:'row',alignItems:'center',marginHorizontal:16,marginBottom:12}}>
          <T style={{fontSize:16,fontWeight:'900',color:t.ink,flex:1}}>{tr(p,'storiesBy')} {w.writer_name}</T>
          <T style={{fontSize:12,fontWeight:'700',color:t.muted}}>{published} {tr(p,'books')}</T>
        </View>
        {writerBooks.map(b=><Row key={b.id} book={b} theme={t} onPress={()=>p.open(b.id)}/>)}
      </>}
      {writerBooks.length===0&&<View style={{alignItems:'center',paddingVertical:40}}>
  <Svg width={120} height={80} viewBox="0 0 120 80">
    <Ellipse cx={60} cy={40} rx={50} ry={25} fill={t.primary+'15'}/>
    <Path d="M30 35 Q60 15 90 35 Q60 55 30 35" fill={t.primary+'10'} stroke={t.primary+'30'} strokeWidth={1}/>
    <Path d="M40 38 Q60 25 80 38 Q60 51 40 38" fill="none" stroke={t.primary+'20'} strokeWidth={0.8}/>
    <Circle cx={60} cy={38} r={3} fill={t.primary+'25'}/>
  </Svg>
  <T style={{color:t.muted,fontSize:14,fontWeight:'700',marginTop:12}}>এর গল্পসমূহ ০</T>
  <T style={{color:t.muted,fontSize:12,marginTop:4}}>এই লেখক এখনো কোনো গল্প প্রকাশ করেননি</T>
</View>}
    </ScrollView>
    {showAuth&&<AuthModal theme={t} lang={p.state.settings.language} onClose={()=>setShowAuth(false)} onGoto={()=>p.setScreen({type:'writer'})}/>}
  </Page>}

function Search(p:C){const [q,setQ]=useState('');const books=q?p.allBooks.filter(b=>`${b.title}${b.author}${b.category}`.includes(q)):p.allBooks.slice(0,3);const writers=q?p.publicWriters.filter(w=>`${w.writer_name}${w.username||''}`.includes(q)):[];return <Page theme={p.theme}><Back title="অনুসন্ধান" theme={p.theme} onPress={()=>p.goBack()}/>{p.isOffline&&<OfflineBanner theme={p.theme} onRetry={()=>p.syncRemote?.()}/>}<View style={[styles.search,{backgroundColor:p.theme.card,borderColor:p.theme.line}]}><Feather name="search" size={18} color={p.theme.muted}/><TextInput autoFocus value={q} onChangeText={setQ} placeholder="বই, লেখক বা বিভাগ খুঁজুন" placeholderTextColor={p.theme.muted} style={{flex:1,color:p.theme.ink,fontFamily:GF()}}/></View>{writers.length>0&&<><T style={[styles.group,{color:p.theme.muted}]}>লেখক</T>{writers.map(w=><Pressable key={w.id} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} style={{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:p.theme.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:p.theme.line}}>{w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:p.theme.tint,alignItems:'center',justifyContent:'center'}}><Feather name="user" size={18} color={p.theme.primary}/></View>}<View style={{flex:1}}><T numberOfLines={1} style={{color:p.theme.ink,fontWeight:'700',fontSize:14}}>{w.writer_name}</T><T numberOfLines={1} style={{color:p.theme.muted,fontSize:12,marginTop:2}}>{w.bio||'লেখক'}</T></View><Feather name="chevron-right" size={16} color={p.theme.muted}/></Pressable>)}</>}<T style={[styles.group,{color:p.theme.muted}]}>{q?`${books.length}টি ফলাফল`:'জনপ্রিয় বই'}</T>{books.map(b=><Row key={b.id} book={b} theme={p.theme} onPress={()=>{p.update({searchHistory:[q,...p.state.searchHistory.filter(x=>x!==q)].filter(Boolean)});p.open(b.id)}}/>)}{!books.length&&!writers.length&&<Empty theme={p.theme}/>}</Page>}
function Notifications(p:C){const t=p.theme;const[selNotif,setSelNotif]=useState<{id:string;title:string;body:string;icon:string;url:string;story_cover:string;time:string}|null>(null);const allNotices=p.remoteNotices.map(n=>({id:n.id,title:n.title,body:n.body,icon:n.icon,url:n.url,story_cover:n.story_cover||'',time:n.time}));const iconBg=t.primary+'22';
  const openDetail=(n:{id:string;title:string;body:string;icon:string;url:string;story_cover:string;time:string})=>{p.update({readNotifications:[...new Set([...p.state.readNotifications,n.id])]});setSelNotif(n)};
  const hasLink=selNotif?.url&&selNotif.url.trim();
  const openLink=()=>{if(!selNotif)return;let u=selNotif.url.trim();if(u&&!/^https?:\/\//i.test(u))u='https://'+u;Linking.openURL(u).catch(()=>{})};
  if(selNotif)return <Page theme={t}><Back title={tr(p,'notificationsTitle')} theme={t} onPress={()=>setSelNotif(null)}/><ScrollView showsVerticalScrollIndicator={false}>
    <View style={{alignItems:'center',marginBottom:20}}>
      {selNotif.story_cover?<Image source={{uri:selNotif.story_cover}} style={{width:80,height:110,borderRadius:12,marginBottom:12}} resizeMode="cover"/>:<View style={{width:56,height:56,borderRadius:16,backgroundColor:iconBg,alignItems:'center',justifyContent:'center',marginBottom:12}}><Feather name={selNotif.icon as any} size={26} color={t.primary}/></View>}
      <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center'}}>{selNotif.title}</T>
      <T style={{fontSize:12,color:t.muted,marginTop:4}}>{selNotif.time}</T>
    </View>
    <View style={{backgroundColor:t.card,borderRadius:16,padding:18,borderWidth:1,borderColor:t.line}}>
      <T style={{fontSize:15,color:t.ink,lineHeight:24}}>{selNotif.body}</T>
    </View>
    {hasLink&&<Pressable onPress={openLink} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:16,backgroundColor:t.primary+'15',borderRadius:12,paddingVertical:14,borderWidth:1,borderColor:t.primary+'30'}}>
      <Feather name="external-link" size={16} color={t.primary}/><T style={{fontSize:14,fontWeight:'700',color:t.primary}}>{tr(p,'openLink')}</T>
    </Pressable>}
  </ScrollView></Page>;
  const list=allNotices.map(n=>{const isRead=p.state.readNotifications.includes(n.id);return <Pressable key={n.id} onPress={()=>openDetail(n)} style={[styles.notifCard,{backgroundColor:isRead?t.card:t.tint,borderColor:t.line,borderLeftColor:isRead?t.line:t.primary,borderLeftWidth:isRead?1:3}]}>
    {n.story_cover?<Image source={{uri:n.story_cover}} style={{width:36,height:48,borderRadius:6,marginRight:10}} resizeMode="cover"/>:<View style={[styles.notifIconWrap,{backgroundColor:isRead?t.line:iconBg}]}><Feather name={I(n.icon)} size={20} color={isRead?t.muted:t.primary}/></View>}
    <View style={{flex:1}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
        <T numberOfLines={1} style={[styles.notifTitle,{color:isRead?t.muted:t.ink}]}>{n.title}</T>
        {!isRead&&<View style={[styles.notifLiveDot,{backgroundColor:t.primary}]}/>}
      </View>
      <T numberOfLines={2} style={[styles.notifBody,{color:t.muted}]}>{n.body}</T>
      <T style={[styles.notifTime,{color:isRead?t.line:t.primary,marginTop:6}]}>{n.time}</T>
    </View>
  </Pressable>});
  return <Page theme={t}><Back title={tr(p,'notificationsTitle')} theme={t} onPress={()=>p.goBack()}/>
    {p.isOffline&&<OfflineBanner theme={t} onRetry={()=>p.syncRemote?.()}/>}
    {list.length?<ScrollView showsVerticalScrollIndicator={false}>{list}</ScrollView>:
    <View style={{alignItems:'center',justifyContent:'center',minHeight:400}}><Feather name="bell-off" size={32} color={t.line}/><T style={{color:t.muted,marginTop:10}}>{tr(p,'noNotifications')}</T></View>}
  </Page>}
function BookList(p:C&{title:string;ids:string[]}){return <Page theme={p.theme}><Back title={p.title} theme={p.theme} onPress={()=>p.goBack()}/><T style={{color:p.theme.muted,marginBottom:15}}>{p.ids.length}টি বই</T>{p.ids.length?p.ids.map(id=>{const b=p.allBooks.find(x=>x.id===id);return b&&<Row key={id} book={b} theme={p.theme} onPress={()=>p.open(id)}/>}):<Empty theme={p.theme}/>}</Page>}
const dStyles=StyleSheet.create({
 hero:{borderRadius:26,overflow:'hidden',marginBottom:18,elevation:5,shadowColor:'#000',shadowOpacity:.28,shadowRadius:12,shadowOffset:{width:0,height:6}},
 heroHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:14,zIndex:3},
 backBtn:{width:40,height:40,borderRadius:20,backgroundColor:'#00000038',alignItems:'center',justifyContent:'center',borderWidth:1},
 heroShare:{width:40,height:40,borderRadius:20,backgroundColor:'#0000002E',alignItems:'center',justifyContent:'center'},
 heroRow:{flexDirection:'row',alignItems:'flex-end',padding:18,paddingTop:6,gap:16,zIndex:2},
 coverCard:{borderRadius:12,elevation:6,shadowColor:'#000',shadowOpacity:.4,shadowRadius:12,shadowOffset:{width:0,height:6}},
 heroInfo:{flex:1,paddingBottom:4},
 heroCat:{alignSelf:'flex-start',borderRadius:8,paddingHorizontal:10,paddingVertical:5,flexDirection:'row',alignItems:'center',gap:5},
 heroTitle:{color:'#fff',fontSize:21,lineHeight:27,fontWeight:'900',marginTop:10},
 heroAuthor:{color:'#E8F2EE',fontSize:13,fontWeight:'700',marginTop:4},
 heroMeta:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8,marginTop:12},
 chip:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#00000030',borderRadius:8,paddingHorizontal:8,paddingVertical:4},
 chipT:{color:'#fff',fontSize:11,fontWeight:'800'},
 actionRow:{flexDirection:'row',gap:8,marginVertical:16},
 actionCard:{flex:1,borderRadius:16,paddingVertical:12,alignItems:'center',justifyContent:'center',borderWidth:1,gap:4},
 actionIconTxt:{fontSize:10,fontWeight:'800'},
 readBtn:{height:56,borderRadius:18,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:2,elevation:3,shadowColor:'#000',shadowOpacity:.22,shadowRadius:8,shadowOffset:{width:0,height:4}},
 readBtnTxt:{color:'#fff',fontWeight:'900',fontSize:16},
 sumCard:{borderRadius:18,padding:16,borderWidth:1},
 chapter:{minHeight:50,borderRadius:12,borderWidth:1,paddingVertical:8,paddingHorizontal:10,marginBottom:6,flexDirection:'row',alignItems:'center',gap:10},
 numGrad:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center'},
 cmtInput:{flex:1,minHeight:44,maxHeight:90,borderRadius:13,borderWidth:1,paddingHorizontal:12,paddingTop:11,fontSize:13,fontFamily:'HindSiliguriMedium'},
 postBtn:{borderRadius:13,paddingHorizontal:14,height:44,alignItems:'center',justifyContent:'center'},
 cmtItem:{flexDirection:'row',gap:11,marginTop:14,alignItems:'flex-start'},
 
 shareBtn:{height:56,borderWidth:1,borderRadius:16,marginTop:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},
 miniBtn:{width:52,borderRadius:16,paddingVertical:14,alignItems:'center',justifyContent:'center',borderWidth:1},
 dlBtn:{height:52,borderRadius:16,marginTop:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
 dlTrack:{height:8,borderRadius:5,marginTop:10,overflow:'hidden',width:'100%'},
 dlFill:{height:8,borderRadius:5},
 chIcon:{width:46,height:46,borderRadius:13,alignItems:'center',justifyContent:'center'},
 ytBtn:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',borderWidth:1.5},
 dlCard:{height:58,borderRadius:18,borderWidth:1,marginTop:14,flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16},
 composer:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderRadius:16,padding:10,marginBottom:6},
 avatar2:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
 nav:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14,gap:10},
 navBtn:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',borderWidth:1},
 navTitle:{flex:1,fontSize:16,fontWeight:'900'},
 panel:{borderRadius:24,overflow:'hidden',borderWidth:1,marginBottom:16},
 storyCard:{flexDirection:'row',alignItems:'center',gap:16,padding:16,zIndex:2},
 coverBox:{borderRadius:14,elevation:6,shadowColor:'#000',shadowOpacity:.4,shadowRadius:10,shadowOffset:{width:0,height:5}},
 storyInfo:{flex:1},
 statusBadge:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:5,borderRadius:8,paddingHorizontal:9,paddingVertical:4},
 storyTitle:{color:'#fff',fontSize:17,lineHeight:22,fontWeight:'900',marginTop:8},
 storyAuthor:{color:'#E8F1EE',fontSize:12.5,fontWeight:'700',marginTop:5},
 tagRow:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:7,marginTop:11},
 miniTag:{flexDirection:'row',alignItems:'center',gap:4,borderRadius:8,paddingHorizontal:8,paddingVertical:4},
 miniTagT:{color:'#fff',fontSize:10.5,fontWeight:'800'},
 interRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',gap:6,borderWidth:1,borderRadius:20,paddingVertical:10,paddingHorizontal:8,marginBottom:14},
 statItem:{flexDirection:'row',alignItems:'center',gap:5},
 statVal:{fontWeight:'900',fontSize:13.5},
  numBadge:{width:30,height:30,borderRadius:9,alignItems:'center',justifyContent:'center'},

  writerCard:{width:124,borderRadius:16,borderWidth:1,overflow:'visible'},
  writerCardBg:{height:52,borderTopLeftRadius:16,borderTopRightRadius:16},
  writerAvatarWrap:{alignItems:'center',marginTop:-28,marginBottom:6},
  writerAvatar:{width:56,height:56,borderRadius:28,borderWidth:3,alignItems:'center',justifyContent:'center',overflow:'hidden'},
  writerCardBody:{alignItems:'center',paddingHorizontal:10,paddingBottom:10},
  writerName:{fontSize:13,fontWeight:'900',textAlign:'center'},
  writerUsername:{fontSize:10.5,fontWeight:'500',marginTop:2,textAlign:'center'},
  writerStatsRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:8,paddingTop:8,borderTopWidth:1},
  writerStat:{flexDirection:'row',alignItems:'center',gap:3},
  writerStatNum:{fontSize:11,fontWeight:'800'},
  writerStatLabel:{fontSize:9,fontWeight:'600'},
  avatar:{width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center'}
  });
function PdfDetailsScreen(p:C&{book:Book}){
  const b0=p.book;if(!b0)return <Page theme={p.theme}><Back title={tr(p,'details')} theme={p.theme} onPress={()=>p.goBack()}/><Empty theme={p.theme}/></Page>;
  const[fullBook,setFullBook]=useState<Book|null>(null);const b=fullBook||b0;
  useEffect(()=>{fetchRemoteBook(b0.id).then(r=>{if(r)setFullBook(r)}).catch(()=>{})},[b0.id]);
  useEffect(()=>{if(fullBook&&rxn===undefined){setLikes(fullBook.likes||0)}},[fullBook?.id]);
  const t=p.theme,accent=b.accent||'#C9972B',base=b.color||'#4A1220',dark=shade(base,-34);
  const fav=p.state.favorites.includes(b.id);
  const rxn=p.state.reactions[b.id];
  const [likes,setLikes]=useState<number>(b.likes||0);const [liked,setLiked]=useState<boolean>(rxn==='like');const [disliked,setDisliked]=useState<boolean>(rxn==='dislike');
  const [cmtCount,setCmtCount]=useState<number|null>(null);
  const [pendingPdfUnlock,setPendingPdfUnlock]=useState<{bookId:string;pdfUrl:string;title:string}|null>(null);
  const [unlocking,setUnlocking]=useState(false);
  const [showMoreMenu,setShowMoreMenu]=useState(false);
  const [showReport,setShowReport]=useState(false);
  const [reportReason,setReportReason]=useState('');
  const [reportDetails,setReportDetails]=useState('');
  const [reportSent,setReportSent]=useState(false);
  const [reporting,setReporting]=useState(false);
  const likeAnim=useRef(new Animated.Value(1)).current;
  const fade=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.timing(fade,{toValue:1,duration:520,useNativeDriver:true}).start();fetchRemoteComments(b.id).then(c=>{if(c&&Array.isArray(c))setCmtCount(c.length)});},[b.id]);
  const setRxn=(v:'like'|'dislike'|undefined)=>{const rx={...p.state.reactions};if(v)rx[b.id]=v;else delete rx[b.id];p.update({reactions:rx})};
  const bumpLike=()=>{likeAnim.setValue(0.4);Animated.spring(likeAnim,{toValue:1,friction:3,tension:170,useNativeDriver:true}).start()};
  const doLike=()=>{if(liked){setLiked(false);setLikes(l=>Math.max(0,l-1));setRxn(undefined);Vibration.vibrate(30);toggleBookLike(p.state.deviceId,b.id,false).then(r=>{if(r>=0)setLikes(r)});}else{setLiked(true);setDisliked(false);setLikes(l=>l+1);setRxn('like');Vibration.vibrate([0,40,40,80]);bumpLike();toggleBookLike(p.state.deviceId,b.id,true).then(r=>{if(r>=0)setLikes(r)});}};
  const doDislike=()=>{if(disliked){setDisliked(false);setRxn(undefined);}else{setDisliked(true);setLiked(false);setRxn('dislike');Vibration.vibrate([0,40]);}};
  const likeScale=likeAnim.interpolate({inputRange:[0,1],outputRange:[0.5,1]});
  const toggleFav=()=>{Vibration.vibrate(20);fav?p.update({favorites:p.state.favorites.filter(x=>x!==b.id)}):p.update({favorites:[...p.state.favorites,b.id]})};
  const goComments=()=>p.setScreen({type:'comments',id:b.id});
  const doReport=async()=>{if(!reportReason||reporting)return;setReporting(true);try{const r=await submitReport(b.id,reportReason,reportDetails,p.state.deviceId,p.state.name||'Anonymous');setReporting(false);if(r?.ok){setReportSent(true);setTimeout(()=>{setShowReport(false);setReportSent(false);setReportReason('');setReportDetails('')},2000)}else{Alert.alert(tr(p,'report'),r?.error||tr(p,'reportError'))}}catch{setReporting(false);Alert.alert(tr(p,'report'),tr(p,'reportError'))}};
  return <Page theme={t}>
    <Animated.View style={{opacity:fade}}>
      <View style={dStyles.nav}>
        <Pressable onPress={()=>p.goBack()} hitSlop={10} style={[dStyles.navBtn,{backgroundColor:t.card,borderColor:t.line}]}><Feather name="arrow-left" size={19} color={t.ink}/></Pressable>
        <T numberOfLines={1} style={[dStyles.navTitle,{color:t.ink}]}>{b.title}</T>
        <Pressable onPress={toggleFav} hitSlop={8} style={[dStyles.navBtn,{backgroundColor:fav?'#EF4444':t.card,borderColor:fav?'#EF4444':t.line}]}><Feather name="heart" size={17} color={fav?'#fff':t.ink}/></Pressable>
        <Pressable onPress={()=>setShowMoreMenu(true)} hitSlop={8} style={[dStyles.navBtn,{backgroundColor:t.card,borderColor:t.line}]}><Feather name="more-vertical" size={17} color={t.ink}/></Pressable>
      </View>
      <View style={[dStyles.panel,{borderColor:'#00000022'}]}>
        {b.cover_url?<Image source={{uri:b.cover_url}} style={{position:'absolute',top:-60,left:-60,right:-60,bottom:-60}} blurRadius={40} resizeMode="cover" fadeDuration={0}/>:null}
        <LinearGradient colors={b.cover_url?['rgba(0,0,0,0.40)','rgba(0,0,0,0.15)','rgba(0,0,0,0.40)']:[base,dark]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Circle cx="90%" cy={-10} r={100} fill={accent+'25'}/>
          <Ellipse cx="8%" cy={220} rx={120} ry={70} fill={accent+'18'}/>
          <Circle cx="75%" cy={190} r={55} fill="#ffffff0A"/>
        </Svg>
        <View style={dStyles.storyCard}>
          <View style={dStyles.coverBox}><Cover book={b}/></View>
          <View style={dStyles.storyInfo}>
            <View style={{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <View style={[dStyles.statusBadge,{backgroundColor:accent+'2E'}]}><Feather name={I(b.categoryIcon)} size={11} color={accent}/><T style={{color:accent,fontSize:10.5,fontWeight:'900'}}>{b.category||'PDF'}</T></View>
              <View style={[dStyles.statusBadge,{backgroundColor:'#8B5CF62E'}]}><Feather name="file-text" size={10} color="#8B5CF6"/><T style={{color:'#8B5CF6',fontSize:10,fontWeight:'900'}}>PDF</T></View>
              {b.writer_status==='ongoing'&&<View style={[dStyles.statusBadge,{backgroundColor:'#10B9812E'}]}><Feather name="loader" size={10} color="#10B981"/><T style={{color:'#10B981',fontSize:10,fontWeight:'900'}}>{copy(p.state.settings.language,'statusOngoing')}</T></View>}
              {b.writer_status==='complete'&&<View style={[dStyles.statusBadge,{backgroundColor:'#F59E0B2E'}]}><Feather name="check-circle" size={10} color="#F59E0B"/><T style={{color:'#F59E0B',fontSize:10,fontWeight:'900'}}>{copy(p.state.settings.language,'statusComplete')}</T></View>}
            </View>
            <T numberOfLines={2} style={dStyles.storyTitle}>{b.title}</T>
            {b.author_name||b.author?<T numberOfLines={1} style={dStyles.storyAuthor}>{b.author_name||b.author}</T>:null}
            <View style={dStyles.tagRow}>
              <View style={[dStyles.miniTag,{backgroundColor:'#ffffff1F'}]}><Feather name="star" size={10} color={accent}/><T style={dStyles.miniTagT}>{b.rating}</T></View>
              {b.isNew?<View style={[dStyles.miniTag,{backgroundColor:'#F59E0B'}]}><T style={dStyles.miniTagT}>{copy(p.state.settings.language,'statusNew')}</T></View>:null}
            </View>
          </View>
        </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14,paddingHorizontal:4}}>
        {b.views_visible!==false?<View style={{flexDirection:'row',alignItems:'center',gap:6}}><Feather name="eye" size={15} color={t.muted}/><T style={{fontSize:13,fontWeight:'700',color:t.muted}}>{b.views}</T></View>:<View/>}
        <View style={{flexDirection:'row',alignItems:'center',gap:16}}>
          <Pressable onPress={doLike} hitSlop={8} style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Animated.View style={{transform:[{scale:likeScale}]}}><Feather name="thumbs-up" size={16} color={liked?'#EF4444':t.muted}/></Animated.View>
            <T style={{fontSize:13,fontWeight:'700',color:liked?'#EF4444':t.muted}}>{likes}</T>
          </Pressable>
          <Pressable onPress={doDislike} hitSlop={8} style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Feather name="thumbs-down" size={15} color={disliked?'#3B82F6':t.muted}/>
          </Pressable>
          <Pressable onPress={goComments} hitSlop={8} style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Feather name="message-circle" size={16} color={cmtCount==null?t.muted:t.primary}/>
            <T style={{fontSize:13,fontWeight:'700',color:cmtCount==null?t.muted:t.primary}}>{cmtCount==null?'…':cmtCount}</T>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={()=>{if(b.pdf_reward_ad!==false){setPendingPdfUnlock({bookId:b.id,pdfUrl:b.pdf_url!,title:b.title})}else{p.setScreen({type:'pdfReader',id:b.id,pdfUrl:b.pdf_url!,title:b.title})}}} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#8B5CF6',height:52,borderRadius:16,elevation:3,shadowColor:'#8B5CF6',shadowOpacity:.3,shadowRadius:8,shadowOffset:{width:0,height:4},marginBottom:16}}>
        <Feather name="file-text" size={20} color="#fff"/>
        <T style={{color:'#fff',fontWeight:'900',fontSize:15}}>PDF পড়ুন</T>
      </Pressable>
      {b.dedication?<View style={{backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:14,padding:14,marginBottom:14}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6}}><Feather name="heart" size={14} color="#EC4899"/><T style={{fontSize:12,fontWeight:'800',color:'#EC4899'}}>সমর্পণ</T></View>
        <T style={{color:t.ink,fontSize:13,lineHeight:20}}>{b.dedication}</T>
      </View>:null}
      <Section title={tr(p,'summary')} theme={t}/>
      <View style={[dStyles.sumCard,{backgroundColor:t.card,borderColor:t.line}]}>
        <T style={{color:t.ink,lineHeight:23}}>{b.description||'—'}</T>
      </View>
    </Animated.View>
    {showMoreMenu&&<Pressable onPress={()=>setShowMoreMenu(false)} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.3)',zIndex:100}}>
      <View style={{position:'absolute',top:50,right:16,backgroundColor:t.card,borderRadius:14,padding:6,minWidth:180,shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.15,shadowRadius:12,elevation:8,borderWidth:1,borderColor:t.line}}>
        <Pressable onPress={()=>{setShowMoreMenu(false);Share.share({message:`${b.title} - ${b.author}`})}} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,paddingHorizontal:14,borderRadius:10}}>
          <Feather name="share-2" size={16} color={t.primary}/><T style={{fontSize:14,fontWeight:'600',color:t.ink}}>{tr(p,'shareBook')}</T>
        </Pressable>
        <View style={{height:1,backgroundColor:t.line,marginHorizontal:8}}/>
        <Pressable onPress={()=>{setShowMoreMenu(false);setShowReport(true)}} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,paddingHorizontal:14,borderRadius:10}}>
          <Feather name="flag" size={16} color="#EF4444"/><T style={{fontSize:14,fontWeight:'600',color:'#EF4444'}}>{tr(p,'reportStory')}</T>
        </Pressable>
      </View>
    </Pressable>}
    {showReport&&<Pressable onPress={()=>{setShowReport(false);setReportSent(false);setReportReason('');setReportDetails('')}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-start',alignItems:'center',paddingHorizontal:24,paddingTop:60,zIndex:101}}>
      <Pressable onPress={()=>{}} style={{width:'100%',maxWidth:400,backgroundColor:t.card,borderRadius:20,padding:24,maxHeight:'85%'}}>
        {reportSent?<View style={{alignItems:'center',paddingVertical:20}}>
          <View style={{width:60,height:60,borderRadius:30,backgroundColor:'#ECFDF5',alignItems:'center',justifyContent:'center',marginBottom:14}}><Feather name="check-circle" size={30} color="#10B981"/></View>
          <T style={{fontSize:16,fontWeight:'800',color:t.ink,textAlign:'center'}}>{tr(p,'reportThanks')}</T>
        </View>:<>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            <T style={{fontSize:17,fontWeight:'900',color:t.ink}}>{tr(p,'reportStory')}</T>
            <Pressable onPress={()=>{setShowReport(false);setReportReason('');setReportDetails('')}}><Feather name="x" size={20} color={t.muted}/></Pressable>
          </View>
          <T style={{fontSize:13,fontWeight:'700',color:t.muted,marginBottom:10}}>{tr(p,'reportReason')}</T>
          {[{k:'abusive',l:tr(p,'reportAbusive'),c:'#EF4444'},{k:'spam',l:tr(p,'reportSpam'),c:'#F59E0B'},{k:'hate',l:tr(p,'reportHate'),c:'#8B5CF6'},{k:'violence',l:tr(p,'reportViolence'),c:'#DC2626'},{k:'inappropriate',l:tr(p,'reportInappropriate'),c:'#F97316'},{k:'other',l:tr(p,'reportOther'),c:'#6B7280'}].map(r=>{const sel=reportReason===r.k;return <Pressable key={r.k} onPress={()=>setReportReason(r.k)} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:11,paddingHorizontal:12,borderRadius:10,marginBottom:6,backgroundColor:sel?r.c+'18':t.bg,borderWidth:1.5,borderColor:sel?r.c:t.line}}>
            <View style={{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:sel?r.c:t.muted,alignItems:'center',justifyContent:'center'}}>{sel?<View style={{width:10,height:10,borderRadius:5,backgroundColor:r.c}}/>:null}</View>
            <T style={{fontSize:14,fontWeight:sel?'800':'600',color:sel?r.c:t.ink,flex:1}}>{r.l}</T>
          </Pressable>})}
          <T style={{fontSize:13,fontWeight:'700',color:t.muted,marginBottom:8,marginTop:4}}>{tr(p,'reportDetails')}</T>
          <TextInput value={reportDetails} onChangeText={setReportDetails} multiline placeholder={tr(p,'reportDetails')} placeholderTextColor={t.muted+'88'} style={{backgroundColor:t.bg,borderWidth:1,borderColor:t.line,borderRadius:12,padding:12,minHeight:70,color:t.ink,fontSize:14,fontWeight:'500',textAlignVertical:'top',marginBottom:16}}/>
          <Pressable disabled={!reportReason||reporting} onPress={doReport} style={{backgroundColor:!reportReason?'#90A4AE':'#EF4444',borderRadius:12,paddingVertical:14,alignItems:'center',opacity:reporting?.6:1}}>
            {reporting?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:15}}>{tr(p,'reportSubmit')}</T>}
          </Pressable>
        </>}
      </Pressable>
    </Pressable>}
    {pendingPdfUnlock&&<Pressable onPress={()=>setPendingPdfUnlock(null)} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',paddingHorizontal:24,zIndex:200}}>
      <Pressable onPress={()=>{}} style={{width:'100%',maxWidth:360,backgroundColor:t.card,borderRadius:24,padding:28,alignItems:'center'}}>
        <View style={{width:64,height:64,borderRadius:32,backgroundColor:'#EDE9FE',alignItems:'center',justifyContent:'center',marginBottom:16}}>
          <Feather name="file-text" size={28} color="#8B5CF6"/>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center',marginBottom:6}}>PDF ডাউনলোড</T>
        <T style={{fontSize:13,fontWeight:'600',color:t.muted,textAlign:'center',marginBottom:8}}>একটি ছোট ad দেখুন এবং PDF পড়ুন</T>
        <View style={{backgroundColor:t.bg,borderRadius:12,padding:12,width:'100%',marginBottom:20}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6}}>
            <Feather name="info" size={14} color={t.primary}/>
            <T style={{fontSize:12,fontWeight:'700',color:t.ink}}>কিভাবে কাজ করে?</T>
          </View>
          <T style={{fontSize:11,fontWeight:'500',color:t.muted,lineHeight:18}}>১. "ad দেখুন" বাটনে ক্লিক করুন{'\n'}২. ৫-১০ সেকেন্ড ad দেখুন{'\n'}৩. PDF অটোমেটিক খুলে যাবে</T>
        </View>
        <Pressable onPress={async()=>{setUnlocking(true);let ok=false;try{ok=await showRewardedAd()}catch{}if(!ok)ok=true;if(ok){setPendingPdfUnlock(null);setTimeout(()=>p.setScreen({type:'pdfReader',id:pendingPdfUnlock.bookId,pdfUrl:pendingPdfUnlock.pdfUrl,title:pendingPdfUnlock.title}),300)}setUnlocking(false)}} disabled={unlocking} style={{width:'100%',backgroundColor:unlocking?'#6D28D9':'#8B5CF6',borderRadius:14,height:52,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8}}>
          {unlocking?<ActivityIndicator color="#fff" size="small"/>:<><Feather name="play" size={18} color="#fff"/>
          <T style={{color:'#fff',fontWeight:'900',fontSize:15}}>ad দেখুন এবং পড়ুন</T></>}
        </Pressable>
        <Pressable onPress={()=>setPendingPdfUnlock(null)} style={{marginTop:12}}>
          <T style={{color:t.muted,fontWeight:'700',fontSize:13}}>বাতিল করুন</T>
        </Pressable>
      </Pressable>
    </Pressable>}
  </Page>}
function Details(p:C&{book:Book}){const b0=p.book;if(!b0)return <Page theme={p.theme}><Back title={tr(p,'details')} theme={p.theme} onPress={()=>p.goBack()}/><Empty theme={p.theme}/></Page>;
  const[fullBook,setFullBook]=useState<Book|null>(null);
  const b=fullBook||b0;
  useEffect(()=>{if(b0.chapters.length===0&&b0.id){fetchRemoteBook(b0.id).then(r=>{if(r)setFullBook(r)}).catch(()=>{})}},[b0.id]);
  useEffect(()=>{if(fullBook&&rxn===undefined){setLikes(fullBook.likes||0)}},[fullBook?.id]);
  const t=p.theme,accent=b.accent||'#C9972B',base=b.color||'#4A1220',dark=shade(base,-34);
  const fav=p.state.favorites.includes(b.id),isOffline=!!p.dlBooks[b.id],down=p.state.downloads.includes(b.id)||isOffline;
  const haveContent=b.chapters.length>0&&b.chapters.some(c=>c.body&&c.body.trim().length>0);
  const rxn=p.state.reactions[b.id];
  const [likes,setLikes]=useState<number>(b.likes||0);const [liked,setLiked]=useState<boolean>(rxn==='like');const [disliked,setDisliked]=useState<boolean>(rxn==='dislike');
  const [cmtCount,setCmtCount]=useState<number|null>(null);
  const [dlPct,setDlPct]=useState<number|null>(null);const [dlFailed,setDlFailed]=useState(false);const dlTimer=useRef<any>(null);const dlSpinAnim=useRef(new Animated.Value(0)).current;
  useEffect(()=>{setDlPct(null);setDlFailed(false)},[b.id]);
  const likeAnim=useRef(new Animated.Value(1)).current;
  const fade=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.timing(fade,{toValue:1,duration:520,useNativeDriver:true}).start();fetchRemoteComments(b.id).then(c=>{if(c&&Array.isArray(c))setCmtCount(c.length)});return()=>{if(dlTimer.current)clearInterval(dlTimer.current)}},[b.id]);
  const setRxn=(v:'like'|'dislike'|undefined)=>{const rx={...p.state.reactions};if(v)rx[b.id]=v;else delete rx[b.id];p.update({reactions:rx})};
  const bumpLike=()=>{likeAnim.setValue(0.4);Animated.spring(likeAnim,{toValue:1,friction:3,tension:170,useNativeDriver:true}).start()};
  const doLike=()=>{if(liked){setLiked(false);setLikes(l=>Math.max(0,l-1));setRxn(undefined);Vibration.vibrate(30);toggleBookLike(p.state.deviceId,b.id,false).then(r=>{if(r>=0)setLikes(r)});}else{setLiked(true);setDisliked(false);setLikes(l=>l+1);setRxn('like');Vibration.vibrate([0,40,40,80]);bumpLike();toggleBookLike(p.state.deviceId,b.id,true).then(r=>{if(r>=0)setLikes(r)});}};
  const doDislike=()=>{if(disliked){setDisliked(false);setRxn(undefined);}else{setDisliked(true);setLiked(false);setRxn('dislike');Vibration.vibrate([0,40]);}};
  const likeScale=likeAnim.interpolate({inputRange:[0,1],outputRange:[0.5,1]});
  React.useEffect(()=>{if(dlPct!==null&&dlPct<100){dlSpinAnim.setValue(0);Animated.loop(Animated.timing(dlSpinAnim,{toValue:1,duration:1000,easing:Easing.linear,useNativeDriver:true})).start()}else{dlSpinAnim.setValue(0)}},[dlPct]);
  const dlSpin=dlSpinAnim.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  const doDownload=async()=>{if(isOffline){p.removeDownload(b.id);return}if(dlPct!==null)return;setDlFailed(false);Vibration.vibrate(30);setDlPct(0);try{const full=await fetchRemoteBook(b.id);if(!full||!full.chapters.length){setDlPct(null);setDlFailed(true);Alert.alert(tr(p,'details'),p.state.settings.language==='bn'?'এই বইটিতে এখনো পড়ার মতো কোনো অধ্যায় নেই।':p.state.settings.language==='hi'?'इस किताब में अभी पढ़ने लायक कोई अध्याय नहीं है।':'No readable chapters yet.');return}const total=full.chapters.length;for(let i=0;i<total;i++){await new Promise(r=>setTimeout(r,60));setDlPct(Math.floor(((i+1)/total)*95))}await saveBookOffline(full);setDlPct(100);Vibration.vibrate([0,40,40,80]);p.downloadBook(b.id);setTimeout(()=>setDlPct(null),2000)}catch{setDlPct(null);setDlFailed(true);setTimeout(()=>setDlFailed(false),3000)}};
  const goComments=()=>p.setScreen({type:'comments',id:b.id});const readAll=()=>p.read(b.id,0);
  const writer=p.publicWriters.find((x:import('./src/types').WriterProfile)=>x.writer_name===b.author);
  const toggleFav=()=>{Vibration.vibrate(20);fav?p.update({favorites:p.state.favorites.filter(x=>x!==b.id)}):p.update({favorites:[...p.state.favorites,b.id]})};
  const goWriter=()=>{if(writer){p.setScreen({type:'writerProfile',writer})}else{p.setScreen({type:'writerProfile',writer:{id:b.id,username:b.author,writer_name:b.author,bio:'',avatar_url:null,follower_count:0,badge:'none'}})}};
  const lastChapter=p.state.positions?.[b.id+'_lastChapter']??-1;const hasStarted=lastChapter>=0;const continueIdx=hasStarted?lastChapter:0;
  const [showMoreMenu,setShowMoreMenu]=useState(false);
  const [showReport,setShowReport]=useState(false);
  const [reportReason,setReportReason]=useState('');
  const [pendingUnlock,setPendingUnlock]=useState<{bookId:string;chapterId:string;chapterIndex:number}|null>(null);
  const [unlocking,setUnlocking]=useState(false);
  const [reportDetails,setReportDetails]=useState('');
  const [reportSent,setReportSent]=useState(false);
  const [reporting,setReporting]=useState(false);
  const doReport=async()=>{if(!reportReason||reporting)return;setReporting(true);try{const r=await submitReport(b.id,reportReason,reportDetails,p.state.deviceId,p.state.name||'Anonymous');setReporting(false);if(r?.ok){setReportSent(true);setTimeout(()=>{setShowReport(false);setReportSent(false);setReportReason('');setReportDetails('')},2000)}else{Alert.alert(tr(p,'report'),r?.error||tr(p,'reportError'))}}catch{setReporting(false);Alert.alert(tr(p,'report'),tr(p,'reportError'))}};
  return <Page theme={t}>
    <Animated.View style={{opacity:fade}}>
      <View style={dStyles.nav}>
        <Pressable onPress={()=>p.goBack()} hitSlop={10} style={[dStyles.navBtn,{backgroundColor:t.card,borderColor:t.line}]}><Feather name="arrow-left" size={19} color={t.ink}/></Pressable>
        <T numberOfLines={1} style={[dStyles.navTitle,{color:t.ink}]}>{b.title}</T>
        <Pressable onPress={toggleFav} hitSlop={8} style={[dStyles.navBtn,{backgroundColor:fav?'#EF4444':t.card,borderColor:fav?'#EF4444':t.line}]}><Feather name="heart" size={17} color={fav?'#fff':t.ink}/></Pressable>
        <Pressable onPress={()=>setShowMoreMenu(true)} hitSlop={8} style={[dStyles.navBtn,{backgroundColor:t.card,borderColor:t.line}]}><Feather name="more-vertical" size={17} color={t.ink}/></Pressable>
      </View>
      {p.isOffline&&!isOffline&&<OfflineBanner theme={t} onRetry={()=>p.syncRemote?.()}/>}
      <View style={[dStyles.panel,{borderColor:'#00000022'}]}>
        {b.cover_url?<Image source={{uri:b.cover_url}} style={{position:'absolute',top:-60,left:-60,right:-60,bottom:-60}} blurRadius={40} resizeMode="cover" fadeDuration={0}/>:null}
        <LinearGradient colors={b.cover_url?['rgba(0,0,0,0.40)','rgba(0,0,0,0.15)','rgba(0,0,0,0.40)']:[base,dark]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Circle cx="90%" cy={-10} r={100} fill={accent+'25'}/>
          <Ellipse cx="8%" cy={220} rx={120} ry={70} fill={accent+'18'}/>
          <Circle cx="75%" cy={190} r={55} fill="#ffffff0A"/>
        </Svg>
        <View style={dStyles.storyCard}>
          <View style={dStyles.coverBox}><Cover book={b}/></View>
          <View style={dStyles.storyInfo}>
            <View style={{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <View style={[dStyles.statusBadge,{backgroundColor:accent+'2E'}]}><Feather name={I(b.categoryIcon)} size={11} color={accent}/><T style={{color:accent,fontSize:10.5,fontWeight:'900'}}>{b.category||tr(p,'chapters')}</T></View>
              {b.writer_status==='ongoing'&&<View style={[dStyles.statusBadge,{backgroundColor:'#10B9812E'}]}><Feather name="loader" size={10} color="#10B981"/><T style={{color:'#10B981',fontSize:10,fontWeight:'900'}}>{copy(p.state.settings.language,'statusOngoing')}</T></View>}
              {b.writer_status==='complete'&&<View style={[dStyles.statusBadge,{backgroundColor:'#F59E0B2E'}]}><Feather name="check-circle" size={10} color="#F59E0B"/><T style={{color:'#F59E0B',fontSize:10,fontWeight:'900'}}>{copy(p.state.settings.language,'statusComplete')}</T></View>}
            </View>
            <T numberOfLines={2} style={dStyles.storyTitle}>{b.title}</T>
            <Pressable onPress={goWriter} style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:2}}>
              {writer?.avatar_url?<Image source={{uri:writer.avatar_url}} style={{width:20,height:20,borderRadius:10}}/>:<View style={{width:20,height:20,borderRadius:10,backgroundColor:'#ffffff2E',alignItems:'center',justifyContent:'center'}}><Feather name="user" size={10} color="#EAF4F1"/></View>}
              <T numberOfLines={1} style={dStyles.storyAuthor}>{b.author}</T>
              <Feather name="chevron-right" size={12} color="#EAF4F199"/>
            </Pressable>
            <View style={dStyles.tagRow}>
              <View style={[dStyles.miniTag,{backgroundColor:'#ffffff1F'}]}><Feather name="star" size={10} color={accent}/><T style={dStyles.miniTagT}>{b.rating}</T></View>
              <View style={[dStyles.miniTag,{backgroundColor:'#ffffff1F'}]}><Feather name="book-open" size={10} color="#EAF4F1"/><T style={dStyles.miniTagT}>{b.chapters.length} {tr(p,'chapters')}</T></View>
              {b.isNew?<View style={[dStyles.miniTag,{backgroundColor:'#F59E0B'}]}><T style={dStyles.miniTagT}>{copy(p.state.settings.language,'statusNew')}</T></View>:null}
            </View>
          </View>
        </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14,paddingHorizontal:4}}>
        {b.views_visible!==false?<View style={{flexDirection:'row',alignItems:'center',gap:6}}><Feather name="eye" size={15} color={t.muted}/><T style={{fontSize:13,fontWeight:'700',color:t.muted}}>{b.views}</T></View>:<View/>}
        <View style={{flexDirection:'row',alignItems:'center',gap:16}}>
          <Pressable onPress={doLike} hitSlop={8} style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Animated.View style={{transform:[{scale:likeScale}]}}><Feather name="thumbs-up" size={16} color={liked?'#EF4444':t.muted}/></Animated.View>
            <T style={{fontSize:13,fontWeight:'700',color:liked?'#EF4444':t.muted}}>{likes}</T>
          </Pressable>
          <Pressable onPress={doDislike} hitSlop={8} style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Feather name="thumbs-down" size={15} color={disliked?'#3B82F6':t.muted}/>
          </Pressable>
          <Pressable onPress={goComments} hitSlop={8} style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Feather name="message-circle" size={16} color={cmtCount==null?t.muted:t.primary}/>
            <T style={{fontSize:13,fontWeight:'700',color:cmtCount==null?t.muted:t.primary}}>{cmtCount==null?'…':cmtCount}</T>
          </Pressable>
        </View>
      </View>
      <View style={{flexDirection:'row',gap:10,marginBottom:14}}>
        {hasStarted?<Pressable onPress={()=>p.read(b.id,continueIdx)} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:t.primary,height:52,borderRadius:16,elevation:3,shadowColor:'#000',shadowOpacity:.2,shadowRadius:8,shadowOffset:{width:0,height:4}}}><Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M8 5v14l11-7L8 5z" fill="#fff"/></Svg><T style={{color:'#fff',fontWeight:'900',fontSize:15}}>{tr(p,'continueReading')}</T></Pressable>:
        <Pressable onPress={readAll} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:t.primary,height:52,borderRadius:16,elevation:3,shadowColor:'#000',shadowOpacity:.2,shadowRadius:8,shadowOffset:{width:0,height:4}}}><Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z" fill="#fff"/></Svg><T style={{color:'#fff',fontWeight:'900',fontSize:15}}>{tr(p,'startReading')}</T></Pressable>}
        {isOffline?<Pressable onPress={doDownload} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#10B981',height:52,borderRadius:16,elevation:3,shadowColor:'#000',shadowOpacity:.2,shadowRadius:8,shadowOffset:{width:0,height:4}}}><Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg><T style={{color:'#fff',fontWeight:'900',fontSize:15}}>{tr(p,'readOffline')}</T></Pressable>:
        dlPct!==null&&dlPct<100?<View style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:t.card,height:52,borderRadius:16,borderWidth:1.5,borderColor:t.primary}}><Animated.View style={{transform:[{rotate:dlSpin}]}}><Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M12 2a10 10 0 0 1 10 10" stroke={t.primary} strokeWidth={2.5} strokeLinecap="round"/></Svg></Animated.View><T style={{color:t.primary,fontWeight:'900',fontSize:14}}>{dlPct}%</T><View style={{flex:1,height:4,backgroundColor:t.line,borderRadius:2,marginLeft:4,overflow:'hidden',maxWidth:80}}><View style={{height:'100%',width:`${dlPct}%`,backgroundColor:t.primary,borderRadius:2}}/></View></View>:
        dlPct===100?<View style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#10B981',height:52,borderRadius:16}}><Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg><T style={{color:'#fff',fontWeight:'900',fontSize:15}}>{copy(p.state.settings.language,'downloaded')||'ডাউনলোড হয়েছে'}</T></View>:
        dlFailed?<View style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#FEE2E2',height:52,borderRadius:16,borderWidth:1.5,borderColor:'#FCA5A5'}}><Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M12 9v4m0 4h.01M12 2l10 18H2L12 2z" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg><T style={{color:'#DC2626',fontWeight:'900',fontSize:14}}>{p.state.settings.language==='bn'?'ব্যর্থ':p.state.settings.language==='hi'?'विफल':'Failed'}</T></View>:
        <Pressable onPress={doDownload} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:t.card,height:52,borderRadius:16,borderWidth:1.5,borderColor:t.line}}><Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke={t.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={t.primary} strokeWidth={2} strokeLinecap="round"/></Svg><T style={{color:t.primary,fontWeight:'900',fontSize:15}}>{tr(p,'readOffline')}</T></Pressable>}
      </View>
      <Section title={`${tr(p,'chapters')} (${b.chapters.length})`} theme={t}/>
      {b.chapters.length?b.chapters.map((c,i)=>{const isReading=lastChapter===i;const isLocked=c.reward_ad&&!p.state.unlockedChapters.includes(c.id);return <Pressable key={c.id} onPress={()=>{if(isLocked){setPendingUnlock({bookId:b.id,chapterId:c.id,chapterIndex:i})}else{p.read(b.id,i)}}} style={[dStyles.chapter,{backgroundColor:isReading?accent+'18':t.card,borderColor:isReading?accent:t.line}]}><View style={[dStyles.numBadge,{backgroundColor:isReading?accent:accent+'1F'}]}><T style={{color:isReading?'#fff':accent,fontWeight:'900',fontSize:13}}>{i+1}</T></View><View style={{flex:1}}><T style={{color:isReading?accent:t.muted,fontSize:11,fontWeight:'700'}}>Chapter {i+1}</T><T numberOfLines={1} style={{color:isReading?accent:t.ink,fontSize:13,fontWeight:'700',marginTop:1}}>{c.title}</T></View><Feather name={isLocked?"lock":"chevron-right"} size={16} color={isLocked?"#EF4444":isReading?accent:t.muted}/></Pressable>}):<Empty theme={t}/>}
      <View style={{alignItems:'center',marginBottom:14}}><T style={{color:t.muted,fontSize:11,fontWeight:'600'}}>{b.chapters.length} {p.state.settings.language==='bn'?'টি অধ্যায়':p.state.settings.language==='hi'?'अध्याय़':'Chapters'}</T></View>
      <Section title={tr(p,'summary')} theme={t}/>
      <View style={[dStyles.sumCard,{backgroundColor:t.card,borderColor:t.line}]}>
        <T style={{color:t.ink,lineHeight:23}}>{b.description||'—'}</T>
      </View>
    </Animated.View>
    {showMoreMenu&&<Pressable onPress={()=>setShowMoreMenu(false)} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.3)',zIndex:100}}>
      <View style={{position:'absolute',top:50,right:16,backgroundColor:t.card,borderRadius:14,padding:6,minWidth:180,shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.15,shadowRadius:12,elevation:8,borderWidth:1,borderColor:t.line}}>
        <Pressable onPress={()=>{setShowMoreMenu(false);Share.share({message:`${b.title} - ${b.author}`})}} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,paddingHorizontal:14,borderRadius:10}}>
          <Feather name="share-2" size={16} color={t.primary}/><T style={{fontSize:14,fontWeight:'600',color:t.ink}}>{tr(p,'shareBook')}</T>
        </Pressable>
        <View style={{height:1,backgroundColor:t.line,marginHorizontal:8}}/>
        <Pressable onPress={()=>{setShowMoreMenu(false);setShowReport(true)}} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,paddingHorizontal:14,borderRadius:10}}>
          <Feather name="flag" size={16} color="#EF4444"/><T style={{fontSize:14,fontWeight:'600',color:'#EF4444'}}>{tr(p,'reportStory')}</T>
        </Pressable>
      </View>
    </Pressable>}
    {showReport&&<Pressable onPress={()=>{setShowReport(false);setReportSent(false);setReportReason('');setReportDetails('')}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-start',alignItems:'center',paddingHorizontal:24,paddingTop:60,zIndex:101}}>
      <Pressable onPress={()=>{}} style={{width:'100%',maxWidth:400,backgroundColor:t.card,borderRadius:20,padding:24,maxHeight:'85%'}}>
        {reportSent?<View style={{alignItems:'center',paddingVertical:20}}>
          <View style={{width:60,height:60,borderRadius:30,backgroundColor:'#ECFDF5',alignItems:'center',justifyContent:'center',marginBottom:14}}><Feather name="check-circle" size={30} color="#10B981"/></View>
          <T style={{fontSize:16,fontWeight:'800',color:t.ink,textAlign:'center'}}>{tr(p,'reportThanks')}</T>
        </View>:<>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            <T style={{fontSize:17,fontWeight:'900',color:t.ink}}>{tr(p,'reportStory')}</T>
            <Pressable onPress={()=>{setShowReport(false);setReportReason('');setReportDetails('')}}><Feather name="x" size={20} color={t.muted}/></Pressable>
          </View>
          <T style={{fontSize:13,fontWeight:'700',color:t.muted,marginBottom:10}}>{tr(p,'reportReason')}</T>
          {[{k:'abusive',l:tr(p,'reportAbusive'),c:'#EF4444'},{k:'spam',l:tr(p,'reportSpam'),c:'#F59E0B'},{k:'hate',l:tr(p,'reportHate'),c:'#8B5CF6'},{k:'violence',l:tr(p,'reportViolence'),c:'#DC2626'},{k:'inappropriate',l:tr(p,'reportInappropriate'),c:'#F97316'},{k:'other',l:tr(p,'reportOther'),c:'#6B7280'}].map(r=>{const sel=reportReason===r.k;return <Pressable key={r.k} onPress={()=>setReportReason(r.k)} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:11,paddingHorizontal:12,borderRadius:10,marginBottom:6,backgroundColor:sel?r.c+'18':t.bg,borderWidth:1.5,borderColor:sel?r.c:t.line}}>
            <View style={{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:sel?r.c:t.muted,alignItems:'center',justifyContent:'center'}}>{sel?<View style={{width:10,height:10,borderRadius:5,backgroundColor:r.c}}/>:null}</View>
            <T style={{fontSize:14,fontWeight:sel?'800':'600',color:sel?r.c:t.ink,flex:1}}>{r.l}</T>
          </Pressable>})}
          <T style={{fontSize:13,fontWeight:'700',color:t.muted,marginBottom:8,marginTop:4}}>{tr(p,'reportDetails')}</T>
          <TextInput value={reportDetails} onChangeText={setReportDetails} multiline placeholder={tr(p,'reportDetails')} placeholderTextColor={t.muted+'88'} style={{backgroundColor:t.bg,borderWidth:1,borderColor:t.line,borderRadius:12,padding:12,minHeight:70,color:t.ink,fontSize:14,fontWeight:'500',textAlignVertical:'top',marginBottom:16}}/>
          <Pressable disabled={!reportReason||reporting} onPress={doReport} style={{backgroundColor:!reportReason?'#90A4AE':'#EF4444',borderRadius:12,paddingVertical:14,alignItems:'center',opacity:reporting?.6:1}}>
            {reporting?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:15}}>{tr(p,'reportSubmit')}</T>}
          </Pressable>
        </>}
      </Pressable>
    </Pressable>}
    {pendingUnlock&&<Pressable onPress={()=>setPendingUnlock(null)} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',paddingHorizontal:24,zIndex:200}}>
      <Pressable onPress={()=>{}} style={{width:'100%',maxWidth:360,backgroundColor:t.card,borderRadius:24,padding:28,alignItems:'center'}}>
        <View style={{width:64,height:64,borderRadius:32,backgroundColor:'#FEF3C7',alignItems:'center',justifyContent:'center',marginBottom:16}}>
          <Feather name="lock" size={28} color="#D97706"/>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center',marginBottom:6}}>এই অধ্যায়টি লক করা আছে</T>
        <T style={{fontSize:13,fontWeight:'600',color:t.muted,textAlign:'center',marginBottom:20}}>একটি ছোট ad দেখে এই অধ্যায়টি আনলক করুন</T>
        <Pressable onPress={async()=>{setUnlocking(true);let ok=false;try{ok=await showRewardedAd()}catch{}if(!ok)ok=true;if(ok){p.update({unlockedChapters:[...p.state.unlockedChapters,pendingUnlock.chapterId]});setPendingUnlock(null);setTimeout(()=>p.read(pendingUnlock.bookId,pendingUnlock.chapterIndex),300)}setUnlocking(false)}} disabled={unlocking} style={{width:'100%',backgroundColor:unlocking?'#6D28D9':'#8B5CF6',borderRadius:14,height:52,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8}}>
          {unlocking?<ActivityIndicator color="#fff" size="small"/>:<><Feather name="play" size={18} color="#fff"/>
          <T style={{color:'#fff',fontWeight:'900',fontSize:15}}>ad দেখে আনলক করুন</T></>}
        </Pressable>
        <Pressable onPress={()=>setPendingUnlock(null)} style={{marginTop:12}}>
          <T style={{color:t.muted,fontWeight:'700',fontSize:13}}>বাতিল করুন</T>
        </Pressable>
      </Pressable>
    </Pressable>}
  </Page>}
function Comments(p:C&{bookId:string}){const t=p.theme;const b=p.allBooks.find(x=>x.id===p.bookId)||p.dlBooks[p.bookId];const [items,setItems]=useState<{id:string;display_name:string;body:string;created_at:string;avatar_url:string}[]>([]);const [draft,setDraft]=useState('');const [posting,setPosting]=useState(false);const [loading,setLoading]=useState(true);const[showSuccess,setShowSuccess]=useState(false);const[approvalRequired,setApprovalRequired]=useState(true);const spinAnim=useRef(new Animated.Value(0)).current;const scaleAnim=useRef(new Animated.Value(0)).current;const checkAnim=useRef(new Animated.Value(0)).current;
  const cmtColors=['#E8F5E9','#FFF3E0','#E3F2FD','#F3E5F5','#E0F7FA','#FFF8E1','#FCE4EC','#E8EAF6','#F1F8E9','#FBE9E7'];
  const isWriter=Boolean(p.state.writer);const isUser=Boolean(p.state.user);
  const commenterName=isWriter?p.state.writer!.writer_name:isUser?p.state.user!.display_name:p.state.name||'পাঠক';
  const commenterAvatar=isWriter?p.state.writer!.avatar_url||'':isUser?p.state.user!.avatar_url||'':'';
  const load=()=>fetchRemoteComments(p.bookId).then(c=>{if(c&&Array.isArray(c))setItems(c as any)}).finally(()=>setLoading(false));
  useEffect(()=>{load();fetchCommentsConfig().then(r=>setApprovalRequired(r.comments_approval)).catch(()=>{});},[p.bookId]);
  useEffect(()=>{if(showSuccess){spinAnim.setValue(0);scaleAnim.setValue(0);checkAnim.setValue(0);Animated.sequence([Animated.parallel([Animated.timing(spinAnim,{toValue:1,duration:800,easing:Easing.out(Easing.cubic),useNativeDriver:true}),Animated.spring(scaleAnim,{toValue:1,friction:5,useNativeDriver:true})]),Animated.timing(checkAnim,{toValue:1,duration:400,useNativeDriver:true})]).start();const timer=setTimeout(()=>setShowSuccess(false),3000);return()=>clearTimeout(timer)}},[showSuccess]);
  const post=async()=>{const x=draft.trim();if(!x||posting)return;setPosting(true);Vibration.vibrate(30);const res=await submitComment(p.bookId,p.state.deviceId,commenterName,x,commenterAvatar);setPosting(false);if(res.ok){setDraft('');setShowSuccess(true);load()}};
  const insets=useSafeAreaInsets();
  return <KeyboardAvoidingView style={{flex:1,backgroundColor:t.bg}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={Platform.OS==='ios'?0:0}>
    <View style={{flex:1,backgroundColor:t.bg}}>
      <View style={{paddingHorizontal:18,paddingTop:insets.top+12,paddingBottom:8}}>
         <Back title={b?.title||tr(p,'comments')} theme={t} onPress={()=>p.goBack()}/>
        {p.isOffline&&<OfflineBanner theme={t} onRetry={()=>p.syncRemote?.()}/>}
        <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8}}><Feather name="message-circle" size={16} color={t.primary}/><T style={{color:t.muted,fontSize:13,fontWeight:'800'}}>{items.length} {tr(p,'comments')}</T><Pressable onPress={load} hitSlop={8}><Feather name="refresh-cw" size={14} color={t.primary}/></Pressable></View>
      </View>
      <ScrollView style={{flex:1}} contentContainerStyle={{paddingHorizontal:18,paddingBottom:100}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {showSuccess&&<Animated.View style={{alignItems:'center',marginVertical:16}}>
          <Animated.View style={{width:60,height:60,borderRadius:30,backgroundColor:'#E8F5E9',alignItems:'center',justifyContent:'center',transform:[{scale:scaleAnim}]}}>
            <Animated.View style={{transform:[{rotate:spinAnim.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']})}]}}><Svg width={28} height={28} viewBox="0 0 24 24" fill="none"><Circle cx={12} cy={12} r={11} stroke="#4CAF50" strokeWidth={2} strokeDasharray={69} strokeLinecap="round"/></Svg></Animated.View>
            <Animated.View style={{position:'absolute',opacity:checkAnim}}><Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M7 12.5l3 3 7-7" stroke="#4CAF50" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg></Animated.View>
          </Animated.View>
          <Animated.View style={{opacity:checkAnim,marginTop:8,alignItems:'center'}}><T style={{fontSize:13,fontWeight:'800',color:'#4CAF50'}}>{p.state.settings.language==='bn'?'মন্তব্য জমা হয়েছে!':p.state.settings.language==='hi'?'टिप्पणी सबमिट हो गई!':'Comment submitted!'}</T>
          {approvalRequired&&<T style={{fontSize:11,color:t.muted,marginTop:3,textAlign:'center'}}>{p.state.settings.language==='bn'?'যাচাইয়ের পরে প্রকাশিত হবে':p.state.settings.language==='hi'?'समीक्षा के बाद दिखाई देगी':'Appears after moderation'}</T>}
          </Animated.View>
        </Animated.View>}
        {loading?<View style={{alignItems:'center',paddingVertical:34}}><ActivityIndicator color={t.primary}/></View>:
        !items.length?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="message-circle" size={30} color={t.muted}/><T style={{color:t.muted,fontSize:13,marginTop:10,textAlign:'center'}}>{tr(p,'noComments')}</T></View>:
        items.map((c,i)=><View key={c.id} style={{width:'100%',flexDirection:'row',gap:10,backgroundColor:cmtColors[i%cmtColors.length],borderRadius:14,padding:12,marginBottom:8}}>
          {c.avatar_url?<Image source={{uri:c.avatar_url}} style={{width:34,height:34,borderRadius:17,flexShrink:0}}/>:<View style={{width:34,height:34,borderRadius:17,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',flexShrink:0}}><T style={{color:'#fff',fontWeight:'900',fontSize:13}}>{(c.display_name||'?')[0]?.toUpperCase()}</T></View>}
          <View style={{flex:1}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><T style={{fontSize:12,fontWeight:'800',color:t.ink}}>{c.display_name}</T><T style={{color:t.muted,fontSize:10}}>{new Date(c.created_at).toLocaleDateString()}</T></View>
            <T style={{color:t.ink,fontSize:13,lineHeight:18,marginTop:2}}>{c.body}</T>
          </View>
        </View>)}
      </ScrollView>
      <View style={{position:'absolute',bottom:0,left:0,right:0,paddingHorizontal:14,paddingBottom:insets.bottom+10,paddingTop:10,backgroundColor:t.bg+'E6',borderTopWidth:1,borderTopColor:'rgba(0,0,0,0.06)'}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:t.card,borderRadius:16,borderWidth:1,borderColor:t.line,padding:6,paddingLeft:12,shadowColor:'#000',shadowOpacity:.05,shadowRadius:8,shadowOffset:{width:0,height:2},elevation:3}}>
          {commenterAvatar?<Image source={{uri:commenterAvatar}} style={{width:32,height:32,borderRadius:16,backgroundColor:t.tint}}/>:<View style={{width:32,height:32,borderRadius:16,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}><T style={{color:t.primary,fontWeight:'900',fontSize:12}}>{(commenterName||'?')[0]}</T></View>}
          <TextInput value={draft} onChangeText={setDraft} placeholder={tr(p,'writeComment')} placeholderTextColor={t.muted} multiline style={{flex:1,color:t.ink,fontSize:13,maxHeight:80,paddingVertical:8,fontFamily:GF()}}/>
          <Pressable disabled={!draft.trim()||posting} onPress={post} style={{width:38,height:38,borderRadius:19,backgroundColor:!draft.trim()?'#90A4AE':t.primary,alignItems:'center',justifyContent:'center',opacity:posting?.6:1}}><Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg></Pressable>
        </View>
      </View>
    </View>
  </KeyboardAvoidingView>
}
function ReaderToggle({value,onChange,primary,bg}:{value:boolean;onChange:(v:boolean)=>void;primary:string;bg:string}){
  const anim=useRef(new Animated.Value(value?1:0)).current;
  useEffect(()=>{Animated.timing(anim,{toValue:value?1:0,duration:250,useNativeDriver:false}).start()},[value]);
  const knobX=anim.interpolate({inputRange:[0,1],outputRange:[3,27]});
  const knobScale=anim.interpolate({inputRange:[0,0.5,1],outputRange:[1,1.15,1]});
  const hexToRgb=(h:string)=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return{r,g,b}};
  const offBg=()=>{try{const c=hexToRgb(bg);return`rgba(${c.r},${c.g},${c.b},0.4)`}catch{return bg}};
  const offBorder=()=>{try{const c=hexToRgb(bg);return`rgba(${c.r},${c.g},${c.b},0.6)`}catch{return bg}};
  return(
    <Pressable onPress={()=>onChange(!value)} style={{width:52,height:30,borderRadius:15,justifyContent:'center'}}>
      <View style={{...StyleSheet.absoluteFillObject,borderRadius:15,borderWidth:1.5,borderColor:value?primary+'33':offBorder(),backgroundColor:value?primary:offBg()}}/>
      <Animated.View style={{position:'absolute',left:0,width:24,height:24,borderRadius:12,backgroundColor:'#fff',transform:[{translateX:knobX},{scale:knobScale}],alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.2,shadowRadius:4,elevation:5}}>
        <Feather name={value?'check':'x'} size={12} color={value?primary:'#aaa'}/>
      </Animated.View>
    </Pressable>
  );
}
function Reader(p:C&{book:Book;chapter:number}){const insets=useSafeAreaInsets();const {width}=useWindowDimensions();const c=p.book.chapters[p.chapter];if(!c)return <View style={{flex:1,backgroundColor:p.theme.reader,alignItems:'center',justifyContent:'center',padding:30}}><Feather name="book-open" size={40} color={p.theme.muted}/><T style={{color:p.theme.ink,fontWeight:'800',fontSize:16,textAlign:'center',marginTop:14}}>এই বইয়ে এখনো কোনো অধ্যায় নেই।</T><Button title="ফিরে যান" icon="arrow-left" onPress={()=>p.setScreen({type:'book',id:p.book.id})}/></View>;const key=c.id,progress=p.state.positions[key]||0;
const [showSettings,setShowSettings]=useState(false);
const [showChapters,setShowChapters]=useState(false);
const [readSeconds,setReadSeconds]=useState(0);
const autoScrollRef=useRef<ReturnType<typeof setInterval>|null>(null);
const scrollRef=useRef<ScrollView>(null);
const autoOffsetRef=useRef(0);
const s=p.state.settings;
useEffect(()=>{setReadSeconds(0)},[p.chapter]);
useEffect(()=>{const timer=setInterval(()=>{setReadSeconds(prev=>prev+1)},60000);return()=>clearInterval(timer)},[]);
useEffect(()=>{if(s.keepScreenOn)activateKeepAwake('lekhoni');else deactivateKeepAwake();return()=>{deactivateKeepAwake().catch(()=>{})}},[s.keepScreenOn]);
useEffect(()=>{const timer=setInterval(()=>{const today=new Date().toISOString().slice(0,10);const prev=p.state.readingActivity[today]||{minutes:0,episodes:0};p.update({readingActivity:{...p.state.readingActivity,[today]:{minutes:(prev.minutes||0)+1,episodes:prev.episodes||0}}})},60000);return()=>clearInterval(timer)},[]);
useEffect(()=>{p.update({positions:{...p.state.positions,[p.book.id+'_lastChapter']:p.chapter}});},[p.chapter]);
useEffect(()=>{trackEvent(p.state.deviceId,p.book.id,'view').catch(()=>{});},[p.book.id]);
const change=(patch:Partial<LocalState['settings']>)=>p.update({settings:{...p.state.settings,...patch}});
useEffect(()=>{if(autoScrollRef.current){clearInterval(autoScrollRef.current);autoScrollRef.current=null}if(s.autoScroll){const ms=Math.max(30,120-s.autoScrollSpeed*20);autoScrollRef.current=setInterval(()=>{autoOffsetRef.current+=2;scrollRef.current?.scrollTo({y:autoOffsetRef.current,animated:true})},ms)}return()=>{if(autoScrollRef.current){clearInterval(autoScrollRef.current);autoScrollRef.current=null}}},[s.autoScroll,s.autoScrollSpeed]);
const readerBg=s.readerTheme==='sepia'?'#F4ECD8':s.readerTheme==='dark'?'#1A1A1A':s.readerTheme==='amoled'?'#000000':p.theme.reader;
const readerInk=s.readerTheme==='sepia'?'#5C4B37':s.readerTheme==='dark'?'#D4D4D4':s.readerTheme==='amoled'?'#E0E0E0':p.theme.ink;
const readerMuted=s.readerTheme==='sepia'?'#8C7E6A':s.readerTheme==='dark'?'#888':s.readerTheme==='amoled'?'#999':p.theme.muted;
const readerPrimary=s.readerTheme==='sepia'?'#8B6914':s.readerTheme==='dark'?'#7B96FF':s.readerTheme==='amoled'?'#7B96FF':p.theme.primary;
const readerLineBg=s.readerTheme==='dark'?'#333':s.readerTheme==='amoled'?'#222':p.theme.line;
const readerCardBg=s.readerTheme==='dark'?'#222':s.readerTheme==='amoled'?'#111':p.theme.card;
const readerSize=Math.max(16,Math.min(28,s.fontSize));
const readerLine=Math.round(Math.max(readerSize+6,Math.min(48,s.lineHeight))*s.lineSpacing);
const readerFont=s.fontFamily==='serif'?'serif':(s.fontFamily==='loose'?'sans-serif':GF());
const sidePadding=Math.max(18,Math.min(30,Math.round(width*.07)));
const formatTime=(mins:number)=>{if(mins<60)return `${mins} ${tr(p,'minutesShort')}`;const h=Math.floor(mins/60);const m=mins%60;return m>0?`${h}h ${m}m`:`${h}h`};
const CustomSlider=({value,min,max,step,onValueChange}:{value:number;min:number;max:number;step:number;onValueChange:(v:number)=>void})=>{const pct=(value-min)/(max-min);const steps=Math.round((max-min)/step);return <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Pressable onPress={()=>{const nv=Math.max(min,value-step);onValueChange(Math.round(nv*10)/10)}} style={{width:32,height:32,borderRadius:16,backgroundColor:readerCardBg,borderWidth:1,borderColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><Feather name="minus" size={16} color={readerPrimary}/></Pressable><View style={{flex:1,height:32,justifyContent:'center'}}><View style={{height:4,borderRadius:2,backgroundColor:readerLineBg,overflow:'hidden'}}><View style={{height:4,borderRadius:2,backgroundColor:readerPrimary,width:`${pct*100}%`}}/></View>{Array.from({length:steps+1}).map((_,i)=>{const x=i/steps;return <View key={i} style={{position:'absolute',left:`${x*100}%`,width:6,height:6,borderRadius:3,backgroundColor:Math.abs(pct-x)<0.01?readerPrimary:readerLineBg,top:13,marginLeft:-3}}/>})}</View><Pressable onPress={()=>{const nv=Math.min(max,value+step);onValueChange(Math.round(nv*10)/10)}} style={{width:32,height:32,borderRadius:16,backgroundColor:readerCardBg,borderWidth:1,borderColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><Feather name="plus" size={16} color={readerPrimary}/></Pressable></View>};
const Toggle=({value,onValueChange}:{value:boolean;onValueChange:(v:boolean)=>void})=><Pressable onPress={()=>onValueChange(!value)} style={{width:50,height:28,borderRadius:14,backgroundColor:value?readerPrimary:readerLineBg,justifyContent:'center',paddingHorizontal:2}}><View style={{width:24,height:24,borderRadius:12,backgroundColor:'#fff',alignSelf:value?'flex-end':'flex-start',shadowColor:'#000',shadowOpacity:0.15,shadowRadius:3,shadowOffset:{width:0,height:1},elevation:2}}/></Pressable>;
const totalProgress=Math.round(((p.chapter*100+progress)/Math.max(1,p.book.chapters.length*100))*100);
return <View style={{flex:1,backgroundColor:readerBg}}>
{s.eyeComfort>0&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:`rgba(255,180,50,${s.eyeComfort/500})`,zIndex:50,pointerEvents:'none'}}/>}
{s.brightness<100&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:`rgba(0,0,0,${(100-s.brightness)/200})`,zIndex:51,pointerEvents:'none'}}/>}
<View style={[styles.readerHead,{borderBottomColor:readerLineBg,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:readerBg}]}>
<Pressable hitSlop={10} onPress={()=>p.setScreen({type:'book',id:p.book.id})}><Feather name="arrow-left" size={22} color={readerInk}/></Pressable>
<View style={{flex:1,marginLeft:16}}>
<T allowFontScaling={false} numberOfLines={1} style={{color:readerInk,fontWeight:'900'}}>{c.title}</T>
<T allowFontScaling={false} numberOfLines={1} style={{color:readerMuted,fontSize:10}}>{p.book.title}{readSeconds>0?` · ${tr(p,'readingTime')} ${formatTime(readSeconds)}`:''}</T>
</View>
<Pressable hitSlop={10} onPress={()=>p.update({bookmarks:p.state.bookmarks.includes(key)?p.state.bookmarks.filter(x=>x!==key):[...p.state.bookmarks,key]})}><Feather name="bookmark" size={21} color={p.state.bookmarks.includes(key)?readerPrimary:readerInk}/></Pressable>
<Pressable hitSlop={10} onPress={()=>setShowSettings(true)}><Feather name="more-vertical" size={21} color={readerInk}/></Pressable>
</View>
<View style={{height:2,backgroundColor:readerLineBg}}><View style={{height:2,backgroundColor:readerPrimary,width:`${totalProgress}%`}}/></View>
<ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} onScroll={e=>{const n=e.nativeEvent;const v=Math.round(n.contentOffset.y/Math.max(1,n.contentSize.height-n.layoutMeasurement.height)*100);if(Math.abs(v-progress)>5)p.update({positions:{...p.state.positions,[key]:v}});autoOffsetRef.current=n.contentOffset.y}} scrollEventThrottle={800} contentContainerStyle={[styles.readerBody,{paddingHorizontal:sidePadding,paddingBottom:insets.bottom+110}]}><T allowFontScaling={false} style={{color:readerPrimary,textAlign:'center',fontWeight:'900'}}>অধ্যায় {p.chapter+1}</T><T allowFontScaling={false} style={[styles.readerTitle,{color:readerInk,fontSize:Math.min(30,Math.max(25,width*.075))}]}>{c.title}</T><T allowFontScaling={false} style={{color:readerInk,fontSize:readerSize,lineHeight:readerLine,fontFamily:readerFont,maxWidth:680,alignSelf:'center'}}>{c.body}</T><T allowFontScaling={false} style={{textAlign:'center',color:readerPrimary,fontSize:25,marginTop:30}}>❦</T></ScrollView>
<View style={[styles.readerTools,{backgroundColor:readerCardBg,borderTopColor:readerLineBg,paddingBottom:Math.max(8,insets.bottom),paddingTop:10}]}><Pressable hitSlop={8} disabled={p.chapter===0} onPress={()=>p.read(p.book.id,p.chapter-1)}><T allowFontScaling={false} style={{color:readerInk,fontSize:12,fontWeight:'700',opacity:p.chapter===0?.3:1}}>← আগের</T></Pressable><Pressable hitSlop={8} onPress={()=>change({fontSize:Math.max(15,s.fontSize-1)})}><T allowFontScaling={false} style={{color:readerPrimary,fontWeight:'900'}}>A−</T></Pressable><Pressable hitSlop={8} onPress={()=>change({fontSize:Math.min(28,s.fontSize+1)})}><T allowFontScaling={false} style={{color:readerPrimary,fontWeight:'900'}}>A+</T></Pressable><Pressable hitSlop={8} onPress={()=>change({dark:!s.dark})}><Feather name="moon" size={19} color={readerPrimary}/></Pressable><Pressable hitSlop={8} disabled={p.chapter===p.book.chapters.length-1} onPress={()=>p.read(p.book.id,p.chapter+1)}><T allowFontScaling={false} style={{color:readerInk,fontSize:12,fontWeight:'700',opacity:p.chapter===p.book.chapters.length-1?.3:1}}>পরের →</T></Pressable></View>
{showSettings&&<Pressable onPress={()=>setShowSettings(false)} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.4)',zIndex:100}}><Pressable onPress={()=>{}} style={{position:'absolute',bottom:0,left:0,right:0,backgroundColor:readerCardBg,borderTopLeftRadius:24,borderTopRightRadius:24,paddingHorizontal:20,paddingTop:16,paddingBottom:Math.max(20,insets.bottom),maxHeight:'80%'}}><View style={{width:40,height:4,borderRadius:2,backgroundColor:readerLineBg,alignSelf:'center',marginBottom:14}}/><T style={{fontSize:17,fontWeight:'900',color:readerInk,marginBottom:16}}>{tr(p,'readerSettings')}</T>
<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:20}}>
<Pressable onPress={()=>{setShowSettings(false);setShowChapters(true)}} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:14,borderBottomWidth:1,borderBottomColor:readerLineBg+'44'}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name="list" size={18} color={readerPrimary}/><T style={{fontSize:14,fontWeight:'700',color:readerInk}}>{tr(p,'chapterList')}</T></View><View style={{flexDirection:'row',alignItems:'center',gap:6}}><T style={{fontSize:12,fontWeight:'600',color:readerMuted}}>{p.chapter+1}/{p.book.chapters.length}</T><Feather name="chevron-right" size={16} color={readerMuted}/></View></Pressable>
<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderTopWidth:1,borderTopColor:readerLineBg+'44'}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name="play-circle" size={18} color={readerPrimary}/><T style={{fontSize:14,fontWeight:'700',color:readerInk}}>{tr(p,'autoScroll')}</T></View><View style={{flexDirection:'row',alignItems:'center',gap:8}}><ReaderToggle value={s.autoScroll} onChange={(v:boolean)=>change({autoScroll:v})} primary={readerPrimary} bg={readerLineBg}/></View></View>
{s.autoScroll&&<View style={{paddingTop:4,paddingBottom:8}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:20}}><Pressable onPress={()=>change({autoScrollSpeed:Math.max(1,s.autoScrollSpeed-1)})} style={{width:40,height:40,borderRadius:12,backgroundColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:20,fontWeight:'900',color:readerPrimary}}>-</T></Pressable><View style={{alignItems:'center'}}><T style={{fontSize:11,color:readerMuted}}>Speed</T><T style={{fontSize:16,fontWeight:'800',color:readerInk,minWidth:50,textAlign:'center'}}>{s.autoScrollSpeed}/5</T></View><Pressable onPress={()=>change({autoScrollSpeed:Math.min(5,s.autoScrollSpeed+1)})} style={{width:40,height:40,borderRadius:12,backgroundColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:20,fontWeight:'900',color:readerPrimary}}>+</T></Pressable></View></View>}
<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderTopWidth:1,borderTopColor:readerLineBg+'44'}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name="smartphone" size={18} color={readerPrimary}/><T style={{fontSize:14,fontWeight:'700',color:readerInk}}>{tr(p,'keepScreenOn')}</T></View><ReaderToggle value={Boolean(s.keepScreenOn)} onChange={(v:boolean)=>change({keepScreenOn:v})} primary={readerPrimary} bg={readerLineBg}/></View>
<T style={{fontSize:13,fontWeight:'700',color:readerMuted,marginBottom:8,marginTop:14}}>{tr(p,'readerTheme')}</T><View style={{flexDirection:'row',gap:8,marginBottom:16}}>{[{k:'default',l:tr(p,'light'),bg:'#FFFFFF',ink:'#1A1A1A'},{k:'sepia',l:tr(p,'sepia'),bg:'#F4ECD8',ink:'#5C4B37'},{k:'dark',l:tr(p,'darkReader'),bg:'#1A1A1A',ink:'#D4D4D4'},{k:'amoled',l:tr(p,'amoled'),bg:'#000000',ink:'#E0E0E0'}].map(t=><Pressable key={t.k} onPress={()=>change({readerTheme:t.k as any})} style={{flex:1,alignItems:'center',paddingVertical:10,borderRadius:12,backgroundColor:t.bg,borderWidth:2,borderColor:s.readerTheme===t.k?readerPrimary:'transparent'}}><View style={{width:28,height:28,borderRadius:8,backgroundColor:t.bg,borderWidth:1,borderColor:t.ink+'33',marginBottom:4,alignItems:'center',justifyContent:'center'}}><Feather name="book-open" size={14} color={t.ink}/></View><T style={{fontSize:10,fontWeight:'700',color:t.ink}}>{t.l}</T></Pressable>)}</View>
<T style={{fontSize:13,fontWeight:'700',color:readerMuted,marginBottom:8}}>{tr(p,'readerFont')}</T><View style={{flexDirection:'row',gap:8,marginBottom:16}}>{[{k:'default',l:tr(p,'fontDefault')},{k:'serif',l:tr(p,'fontSerif')},{k:'loose',l:tr(p,'fontLoose')}].map(f=><Pressable key={f.k} onPress={()=>change({fontFamily:f.k as any})} style={{flex:1,alignItems:'center',paddingVertical:10,borderRadius:12,backgroundColor:s.fontFamily===f.k?readerPrimary+'18':'transparent',borderWidth:1.5,borderColor:s.fontFamily===f.k?readerPrimary:readerLineBg}}><T style={{fontSize:13,fontWeight:s.fontFamily===f.k?'800':'600',color:s.fontFamily===f.k?readerPrimary:readerInk}}>{f.l}</T></Pressable>)}</View>
<View style={{marginBottom:14}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><T style={{fontSize:13,fontWeight:'700',color:readerMuted}}>{tr(p,'lineSpacing')}</T><T style={{fontSize:12,fontWeight:'700',color:readerPrimary}}>{s.lineSpacing.toFixed(1)}x</T></View><View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:20}}><Pressable onPress={()=>change({lineSpacing:Math.max(0.8,+(s.lineSpacing-0.1).toFixed(1))})} style={{width:40,height:40,borderRadius:12,backgroundColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:20,fontWeight:'900',color:readerPrimary}}>-</T></Pressable><T style={{fontSize:16,fontWeight:'800',color:readerInk,minWidth:50,textAlign:'center'}}>{s.lineSpacing.toFixed(1)}x</T><Pressable onPress={()=>change({lineSpacing:Math.min(2.0,+(s.lineSpacing+0.1).toFixed(1))})} style={{width:40,height:40,borderRadius:12,backgroundColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:20,fontWeight:'900',color:readerPrimary}}>+</T></Pressable></View></View>
<View style={{marginBottom:14}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><T style={{fontSize:13,fontWeight:'700',color:readerMuted}}>{tr(p,'brightness')}</T><T style={{fontSize:12,fontWeight:'700',color:readerPrimary}}>{s.brightness}%</T></View><CustomSlider value={s.brightness} min={20} max={100} step={5} onValueChange={(v:number)=>change({brightness:v})}/></View>
<View style={{marginBottom:14}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Feather name="eye" size={16} color={readerMuted}/><T style={{fontSize:13,fontWeight:'700',color:readerMuted}}>{tr(p,'eyeComfort')}</T></View><T style={{fontSize:12,fontWeight:'700',color:readerPrimary}}>{s.eyeComfort>0?s.eyeComfort+'%':'OFF'}</T></View><CustomSlider value={s.eyeComfort} min={0} max={80} step={5} onValueChange={(v:number)=>change({eyeComfort:v})}/></View>
<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderTopWidth:1,borderTopColor:readerLineBg+'44'}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name="volume-2" size={18} color={readerMuted}/><T style={{fontSize:14,fontWeight:'600',color:readerInk}}>{tr(p,'volumeScroll')}</T></View><ReaderToggle value={Boolean(s.volumeScroll)} onChange={(v:boolean)=>change({volumeScroll:v})} primary={readerPrimary} bg={readerLineBg}/></View>
</ScrollView>
</Pressable></Pressable>}
{showChapters&&<Pressable onPress={()=>setShowChapters(false)} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.4)',zIndex:100}}><Pressable onPress={()=>{}} style={{position:'absolute',bottom:0,left:0,right:0,backgroundColor:readerCardBg,borderTopLeftRadius:24,borderTopRightRadius:24,paddingHorizontal:20,paddingTop:16,paddingBottom:Math.max(20,insets.bottom),maxHeight:'80%'}}><View style={{width:40,height:4,borderRadius:2,backgroundColor:readerLineBg,alignSelf:'center',marginBottom:14}}/>
<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14}}><T style={{fontSize:17,fontWeight:'900',color:readerInk}}>{tr(p,'chapterList')}</T><T style={{fontSize:12,fontWeight:'700',color:readerMuted}}>{p.book.chapters.length} {tr(p,'chapterList')}</T></View>
<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:10}}>{p.book.chapters.map((ch,i)=>{
const isCurrent=i===p.chapter;
const pos=p.state.positions[ch.id];
return <Pressable key={ch.id} onPress={()=>{setShowChapters(false);p.read(p.book.id,i)}} style={{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:12,paddingHorizontal:12,borderRadius:12,backgroundColor:isCurrent?readerPrimary+'18':'transparent'}}>
<View style={{width:36,height:36,borderRadius:10,backgroundColor:isCurrent?readerPrimary:readerLineBg,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:13,fontWeight:'900',color:isCurrent?'#fff':readerInk}}>{i+1}</T></View>
<View style={{flex:1}}><T numberOfLines={1} style={{fontSize:14,fontWeight:isCurrent?'800':'600',color:isCurrent?readerPrimary:readerInk}}>{ch.title}</T><T style={{fontSize:11,color:readerMuted}}>{ch.minutes||5} {tr(p,'minutesShort')}{pos?` · ${pos}%`:''}</T></View>
{isCurrent&&<Feather name="book-open" size={16} color={readerPrimary}/>}
</Pressable>})}</ScrollView>
</Pressable></Pressable>}
</View>}
function AnimatedToggle({value,onChange,color,track}:{value:boolean;onChange:(v:boolean)=>void;color:string;track:string}){
  const anim=useRef(new Animated.Value(value?1:0)).current;
  useEffect(()=>{Animated.timing(anim,{toValue:value?1:0,duration:230,useNativeDriver:false}).start();},[value,anim]);
  const thumbX=anim.interpolate({inputRange:[0,1],outputRange:[2,26]});
  const bg=anim.interpolate({inputRange:[0,1],outputRange:[track,color]});
  return <Pressable onPress={()=>onChange(!value)} style={{width:54,height:30,borderRadius:15,justifyContent:'center'}}>
    <Animated.View style={{...StyleSheet.absoluteFillObject,borderRadius:15,backgroundColor:bg}}/>
    <Animated.View style={{position:'absolute',top:3,width:24,height:24,borderRadius:12,backgroundColor:'#fff',transform:[{translateX:thumbX}],alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.25,shadowRadius:3,elevation:4}}>
      <Feather name={value?'moon':'sun'} size={13} color={value?'#FCD34D':'#B45309'}/>
    </Animated.View>
  </Pressable>;
}
function Settings(p:C){
  const set=(x:Partial<LocalState['settings']>)=>p.update({settings:{...p.state.settings,...x}});
  const language=p.state.settings.language;
  const t=p.theme;
  const currentThemeId=p.state.settings.themeId||'katagolap';
  const darkMode=p.state.settings.dark;

  const themes:{id:ThemeId;nameBn:string;nameEn:string;colors:string[]}[]=[
    {id:'nilkantha',nameBn:'নীলকণ্ঠ',nameEn:'Blue Jay',colors:['#2563EB','#1E293B']},
    {id:'kashful',nameBn:'কাশফুল',nameEn:'Kash',colors:['#78716C','#1C1917']},
    {id:'mala',nameBn:'মালা',nameEn:'Garland',colors:['#D97706','#78350F']},
    {id:'meghdoot',nameBn:'মেঘদূত',nameEn:'Cloud',colors:['#0EA5E9','#0C4A6E']},
    {id:'bashanti',nameBn:'বসন্তী',nameEn:'Spring',colors:['#CA8A04','#713F12']},
    {id:'sona',nameBn:'সোনা',nameEn:'Gold',colors:['#B45309','#78350F']},
    {id:'rong',nameBn:'রঙ',nameEn:'Violet',colors:['#7C3AED','#2E1065']},
    {id:'agun',nameBn:'আগুন',nameEn:'Fire',colors:['#DC2626','#7F1D1D']},
    {id:'swapna',nameBn:'স্বপ্ন',nameEn:'Dream',colors:['#A855F7','#3B0764']},
    {id:'prithvi',nameBn:'পৃথিবী',nameEn:'Earth',colors:['#65A30D','#1A2E05']},
    {id:'katagolap',nameBn:'কাঠগোলাপ',nameEn:'Rosewood',colors:['#7B1E2B','#241A1C']},
    {id:'sepia',nameBn:'সেপিয়া',nameEn:'Sepia',colors:['#8B6914','#2C2416']},
    {id:'midnight',nameBn:'মধ্যরাত',nameEn:'Midnight',colors:['#4A6CF7','#1A1F36']},
    {id:'godhuli',nameBn:'গোধূলি',nameEn:'Dusk',colors:['#C05621','#2D1B0E']},
    {id:'sagar',nameBn:'সাগর',nameEn:'Ocean',colors:['#1A7FA0','#0F2B33']},
    {id:'oronno',nameBn:'অরণ্য',nameEn:'Forest',colors:['#2D7A3A','#1A2E1E']},
    {id:'lavender',nameBn:'ল্যাভেন্ডার',nameEn:'Lavender',colors:['#7C3AED','#1E1533']},
    {id:'golapi',nameBn:'গোলাপি',nameEn:'Pink',colors:['#D94A7A','#2E1520']},
    {id:'shapla',nameBn:'শাপলা',nameEn:'Water Lily',colors:['#0E9AA7','#0E2A2E']},
    {id:'golap',nameBn:'গোলাপ',nameEn:'Rose',colors:['#E63946','#3A1520']},
  ];

  const Section=({title,children}:{title:string;children:React.ReactNode})=><><T style={[styles.group,{color:t.muted,marginTop:16,marginBottom:8,fontSize:13,fontWeight:'700'}]}>{title}</T><View style={[styles.menuGroup,{borderRadius:16,borderWidth:1,borderColor:t.line,backgroundColor:t.card,overflow:'hidden'}]}>{children}</View></>;
  const Row=({icon,iconBg,iconColor,children,onPress}:{icon:string;iconBg:string;iconColor:string;children:React.ReactNode;onPress?:()=>void})=><Pressable onPress={onPress} disabled={!onPress} style={[styles.menuItem,{backgroundColor:t.card,opacity:onPress?1:0.9}]}><View style={[styles.menuIconBig,{backgroundColor:iconBg}]}><Feather name={icon as any} size={18} color={iconColor}/></View>{children}</Pressable>;
  const Sep=()=><View style={{height:1,backgroundColor:t.line,marginLeft:62}}/>;

  return <Page theme={t}>
    <Back title={tr(p,'settings')} theme={t} onPress={()=>p.goBack()}/>
    {p.isOffline&&<OfflineBanner theme={t} onRetry={()=>p.syncRemote?.()}/>}

    {/* Themes */}
    <T style={[styles.group,{color:t.muted,marginTop:4,marginBottom:8,fontSize:13,fontWeight:'700'}]}>{copy(language,'settingsThemes')}</T>
    <View style={{borderRadius:16,borderWidth:1,borderColor:t.line,backgroundColor:t.card,padding:10}}>
      <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:8,marginLeft:2}}>{language==='bn'?'নতুন থিম':language==='hi'?'नई थीम':'New Themes'}</T>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:12}}>
        {themes.slice(0,10).map(th=>{
          const selected=currentThemeId===th.id;
          const selTheme=themeFor(th.id,false);
          return <Pressable key={th.id} onPress={()=>set({themeId:th.id})}
            style={{width:'18.5%',borderRadius:12,overflow:'hidden',borderWidth:2,borderColor:selected?t.primary:selTheme.line,backgroundColor:selTheme.card}}>
            <View style={{backgroundColor:selTheme.primary,alignItems:'center',justifyContent:'center',paddingVertical:10}}>
              <ThemeSVGIcon themeId={th.id} s={34} color="#fff"/>
            </View>
            <View style={{alignItems:'center',paddingVertical:4}}>
              <T style={{fontSize:8,fontWeight:'800',color:selTheme.ink}} numberOfLines={1}>{th.nameBn}</T>
            </View>
            {selected&&<View style={{position:'absolute',top:3,right:3,width:14,height:14,borderRadius:7,backgroundColor:t.primary,alignItems:'center',justifyContent:'center'}}><Feather name="check" size={8} color="#fff"/></View>}
          </Pressable>})}
      </View>
      <View style={{height:1,backgroundColor:t.line,marginBottom:10}}/>
      <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:8,marginLeft:2}}>{language==='bn'?'ক্লাসিক থিম':language==='hi'?'क्लासिक थीम':'Classic Themes'}</T>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
        {themes.slice(10).map(th=>{
          const selected=currentThemeId===th.id;
          const selTheme=themeFor(th.id,false);
          const flowerKinds=new Set(['shapla','golap']);
          const isFlower=flowerKinds.has(th.id);
          return <Pressable key={th.id} onPress={()=>set({themeId:th.id})}
            style={{width:'18.5%',borderRadius:12,overflow:'hidden',borderWidth:2,borderColor:selected?t.primary:selTheme.line,backgroundColor:selTheme.card}}>
            <View style={{backgroundColor:selTheme.bg,alignItems:'center',justifyContent:'center',paddingVertical:10,opacity:0.95}}>
              <FlowerArt kind={isFlower?th.id:'dot'} s={34} primary={selTheme.primary} tint={selTheme.tint} bg={selTheme.bg}/>
            </View>
            <View style={{alignItems:'center',paddingVertical:4}}>
              <T style={{fontSize:8,fontWeight:'800',color:selTheme.ink}} numberOfLines={1}>{th.nameEn}</T>
            </View>
            {selected&&<View style={{position:'absolute',top:3,right:3,width:14,height:14,borderRadius:7,backgroundColor:t.primary,alignItems:'center',justifyContent:'center'}}><Feather name="check" size={8} color="#fff"/></View>}
          </Pressable>})}
      </View>
    </View>

    {/* Appearance */}
    <Section title={copy(language,'settingsAppearance')}>
      <Row icon="sun" iconBg={darkMode?'#1E293B':t.tint} iconColor={darkMode?'#FCD34D':t.primary}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>{darkMode?tr(p,'darkMode'):tr(p,'lightMode')}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{darkMode?tr(p,'darkModeSub'):tr(p,'lightModeSub')}</T>
        </View>
        <AnimatedToggle value={darkMode} onChange={(v)=>set({dark:v})} color={t.primary} track={t.line}/>
      </Row>
      <Sep/>
      <Row icon="type" iconBg={t.tint} iconColor={t.primary}>
        <T style={[styles.rowTitle,{color:t.ink,flex:1}]}>{tr(p,'readerSize')}</T>
        <View style={{alignItems:'center'}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
            <Pressable onPress={()=>{const f=Math.max(16,p.state.settings.fontSize-2);set({fontSize:f,lineHeight:f+13});}} style={{width:34,height:34,borderRadius:11,backgroundColor:p.state.settings.fontSize<=16?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}>
              <Feather name="minus" size={17} color={p.state.settings.fontSize<=16?t.muted:t.primary}/>
            </Pressable>
            <View style={{width:52,height:52,borderRadius:16,borderWidth:2,borderColor:t.line,backgroundColor:t.bg,alignItems:'center',justifyContent:'center'}}>
              <T style={{fontSize:Math.max(12,p.state.settings.fontSize-2),fontWeight:'900',color:t.ink,lineHeight:Math.max(12,p.state.settings.fontSize-2)+6}}>Aa</T>
            </View>
            <Pressable onPress={()=>{const f=Math.min(28,p.state.settings.fontSize+2);set({fontSize:f,lineHeight:f+13});}} style={{width:34,height:34,borderRadius:11,backgroundColor:p.state.settings.fontSize>=28?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}>
              <Feather name="plus" size={17} color={p.state.settings.fontSize>=28?t.muted:t.primary}/>
            </Pressable>
          </View>
          <T style={{color:t.muted,fontSize:10,marginTop:4}}>{p.state.settings.fontSize}px</T>
        </View>
      </Row>
    </Section>

    {/* Reading */}
    <Section title={copy(language,'settingsReading')}>
      <Row icon="align-justify" iconBg={t.tint} iconColor={t.primary}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>{copy(language,'settingsLineSpacing')}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{copy(language,'lineSpacingDesc')}</T>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Pressable onPress={()=>set({lineSpacing:Math.round((Math.max(0.8,p.state.settings.lineSpacing-0.1))*10)/10})} style={{width:30,height:30,borderRadius:9,backgroundColor:p.state.settings.lineSpacing<=0.8?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}><Feather name="minus" size={15} color={p.state.settings.lineSpacing<=0.8?t.muted:t.primary}/></Pressable>
          <T style={{color:t.ink,fontWeight:'800',fontSize:13,width:30,textAlign:'center'}}>{p.state.settings.lineSpacing.toFixed(1)}</T>
          <Pressable onPress={()=>set({lineSpacing:Math.round((Math.min(1.8,p.state.settings.lineSpacing+0.1))*10)/10})} style={{width:30,height:30,borderRadius:9,backgroundColor:p.state.settings.lineSpacing>=1.8?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}><Feather name="plus" size={15} color={p.state.settings.lineSpacing>=1.8?t.muted:t.primary}/></Pressable>
        </View>
      </Row>
      <Sep/>
      <Row icon="align-left" iconBg={t.tint} iconColor={t.primary}>
        <T style={[styles.rowTitle,{color:t.ink,flex:1}]}>{copy(language,'settingsFont')}</T>
        <View style={{flexDirection:'row',gap:6}}>
          {([['default',copy(language,'fontDefault')],['serif',copy(language,'fontSerif')],['loose',copy(language,'fontLoose')]] as const).map(([k,l])=>{
            const act=p.state.settings.fontFamily===k;
            return <Pressable key={k} onPress={()=>set({fontFamily:k})} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:9,backgroundColor:act?t.primary:t.bg,borderWidth:1,borderColor:act?t.primary:t.line}}><T style={{fontWeight:'800',fontSize:11,color:act?'#fff':t.muted}}>{l}</T></Pressable>;
          })}
        </View>
      </Row>
    </Section>

    {/* Language */}
    <Section title={copy(language,'settingsLanguage')}>
      {([['en','english'],['bn','bangla'],['hi','hindi']] as const).map(([code,key],i)=>(
        <Pressable key={code} onPress={()=>{set({language:code})}} style={[styles.languageRow,{backgroundColor:t.card,paddingHorizontal:14,paddingVertical:12,borderBottomWidth:i===2?0:1,borderBottomColor:t.line}]}>
          <View style={[styles.radio,{borderColor:language===code?t.primary:t.muted}]}>{language===code&&<View style={[styles.radioDot,{backgroundColor:t.primary}]}/>}</View>
          <View style={{flex:1}}>
            <T style={{color:t.ink,fontWeight:language===code?'900':'600',fontSize:14}}>{copy(code,key)}</T>
            <T style={{color:t.muted,fontSize:10}}>{code==='en'?'English':code==='bn'?'বাংলा':'हिन्दी'}</T>
          </View>
          {language===code&&<Feather name="check" size={16} color={t.primary}/>}
        </Pressable>))}
    </Section>

    {/* Data & Sync */}
    <Section title={copy(language,'settingsData')}>
      <Row icon={p.state.online?'refresh-cw':'cloud-off'} iconBg={p.state.online?t.tint:'#FEEBC8'} iconColor={p.state.online?t.primary:'#B45309'} onPress={()=>{p.syncRemote?.();trackEvent(p.state.deviceId,'all','view');}}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>{copy(language,'settingsSyncNow')}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.online?(language==='bn'?'সব ঠিক আছে':language==='hi'?'सब ठीक है':'All good'):(language==='bn'?'অফলাইন':language==='hi'?'ऑफ़लाइन':'Offline')}</T>
        </View>
        <View style={{backgroundColor:t.tint,borderRadius:10,paddingVertical:8,paddingHorizontal:12}}>
          <T style={{color:t.primary,fontWeight:'900',fontSize:12}}>{p.state.online?copy(language,'settingsSynced'):copy(language,'settingsOffline')}</T>
        </View>
      </Row>
      <Sep/>
      <Row icon="trash-2" iconBg="#FEEBC8" iconColor="#B45309" onPress={()=>p.update({searchHistory:[]})}>
        <T style={[styles.rowTitle,{color:t.ink,flex:1}]}>{copy(language,'settingsClearSearch')}</T>
        <View style={{backgroundColor:t.bg,borderWidth:1,borderColor:t.line,borderRadius:10,paddingVertical:7,paddingHorizontal:12}}>
          <T style={{color:t.primary,fontWeight:'800',fontSize:12}}>{language==='bn'?'মুছুন':language==='hi'?'साफ़ करें':'Clear'}</T>
        </View>
      </Row>
    </Section>

    {/* Downloads */}
    <Section title={language==='bn'?'ডাউনলোড':language==='hi'?'डाउनलोड':'Downloads'}>
      <Row icon="download-cloud" iconBg={t.tint} iconColor={t.primary}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>{p.state.downloads.length} {language==='bn'?'টি ডাউনলোড':language==='hi'?'डाउनलोड':'downloaded'}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{language==='bn'?'অফলাইনে পড়ার জন্য সংরক্ষিত':language==='hi'?'ऑफ़लाइन पढ़ने के लिए सहेजा गया':'Saved for offline reading'}</T>
        </View>
      </Row>
      <Sep/>
      <Row icon="trash-2" iconBg="#FEEBC8" iconColor="#B45309" onPress={()=>Alert.alert(copy(language,'settingsClearAll'),language==='bn'?'সব ডাউনলোড মুছে ফেলা হবে। নিশ্চিত?':language==='hi'?'सभी डाउनलोड हटा दिए जाएंगे। पक्का?':'All downloads will be cleared. Sure?',[{text:copy(language,'cancel'),style:'cancel'},{text:language==='bn'?'মুছুন':language==='hi'?'हटाएँ':'Clear',style:'destructive',onPress:()=>p.update({downloads:[]})}])}>
        <T style={[styles.rowTitle,{color:'#B91C1C',flex:1}]}>{copy(language,'settingsClearAll')}</T>
        <View style={{backgroundColor:'#FEE2E2',borderRadius:10,paddingVertical:8,paddingHorizontal:12}}>
          <T style={{color:'#B91C1C',fontWeight:'900',fontSize:12}}>{language==='bn'?'মুছুন':language==='hi'?'हटाएँ':'Clear'}</T>
        </View>
      </Row>
    </Section>

    {/* Storage */}
    <Section title={copy(language,'settingsStorage')}>
      <Row icon="hard-drive" iconBg="#FEE2E2" iconColor="#B91C1C" onPress={()=>Alert.alert(copy(language,'settingsReset'),language==='bn'?'থিম, বুকমার্ক, ইতিহাস — সব ডেটা মুছে যাবে। নিশ্চিত?':language==='hi'?'थीम, बुकमार्क, इतिहास — सब डेटा मिटा दिया जाएगा। पक्का?':'Theme, bookmarks, history — all data will be deleted. Sure?',[{text:copy(language,'cancel'),style:'cancel'},{text:language==='bn'?'রিসেট':language==='hi'?'रीसेट':'Reset',style:'destructive',onPress:async()=>{p.update(initialState);await clearState();}}])}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:'#B91C1C'}]}>{copy(language,'settingsReset')}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{copy(language,'settingsResetDesc')}</T>
        </View>
        <View style={{backgroundColor:'#FEE2E2',borderRadius:10,paddingVertical:8,paddingHorizontal:12}}>
          <T style={{color:'#B91C1C',fontWeight:'900',fontSize:12}}>{language==='bn'?'রিসেট':language==='hi'?'रीसेट':'Reset'}</T>
        </View>
      </Row>
    </Section>

    {/* About */}
    <Section title={copy(language,'settingsAbout')}>
      <Row icon="book-open" iconBg={t.tint} iconColor={t.primary} onPress={()=>p.setScreen({type:'aboutApp'})}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>Lekhoni Kahini</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{copy(language,'settingsAppDesc')}</T>
        </View>
        <Feather name="chevron-right" size={18} color={t.muted}/>
      </Row>
      <Sep/>
      <Row icon="star" iconBg={t.tint} iconColor={t.primary} onPress={()=>{try{Linking.openURL('https://play.google.com/store/apps/details?id=com.lekhoni.kahini')}catch{Share.share({message:'Lekhoni Kahini\nhttps://play.google.com/store/apps/details?id=com.lekhoni.kahini'})}}}>
        <T style={[styles.rowTitle,{color:t.ink,flex:1}]}>{copy(language,'settingsRate')}</T>
        <View style={{backgroundColor:t.tint,borderRadius:10,paddingVertical:8,paddingHorizontal:12}}>
          <T style={{color:t.primary,fontWeight:'900',fontSize:12}}>★</T>
        </View>
      </Row>
      <Sep/>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="info" size={18} color={t.primary}/></View>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>Lekhoni Kahini</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>© 2026 Kawsar Hosen</T>
        </View>
         <T style={{color:t.muted,fontSize:12,fontWeight:'700'}}>v1.1.0</T>
      </View>
    </Section>
  </Page>}
function GoogleSignInButton({onResult,onError,theme:t,lang}:{onResult:(w:any,token:string)=>void;onError:(msg:string)=>void;theme:Theme;lang:Language}){
  const[loading,setLoading]=useState(false);

  const handlePress=async()=>{
    setLoading(true);onError('');
    try{
      const{GoogleSignin}=await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId:'940343114841-pd5po6gp5dij90nlp5k28tigp5qqr1rt.apps.googleusercontent.com',
        offlineAccess:true,
        scopes:['openid','profile','email'],
      });
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog:true});
      try{await GoogleSignin.signOut()}catch{}
      const userInfo=await GoogleSignin.signIn();
      const tokens=await GoogleSignin.getTokens();
      if(tokens.idToken){
        const w=await writerGoogleAuth(tokens.idToken);
        if(w)onResult(w,w.token);
        else onError(copy(lang,'networkError'));
      }else onError('No ID token received');
    }catch(e:any){
      if(e.code==='SIGN_IN_CANCELLED'){onError('');setLoading(false);return}
      onError(e.message||'Google sign-in failed');
    }finally{setLoading(false)}
  };

  return <Pressable disabled={loading} onPress={handlePress} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',height:46,borderRadius:12,borderWidth:1.5,borderColor:t.line,backgroundColor:t.card,gap:10,opacity:loading?0.6:1}}>
    {loading?<ActivityIndicator color={t.ink} size="small"/>:<><GoogleIcon size={20}/>
    <T style={{color:t.ink,fontWeight:'600',fontSize:14}}>{copy(lang,'continueWithGoogle')}</T></>}
  </Pressable>
}

function Writer(p:C){
  const[authTab,setAuthTab]=useState<'login'|'register'>('login');
  const[form,setForm]=useState({username:'',writerName:'',email:'',password:''});
  const[privacyConsent,setPrivacyConsent]=useState(false);
  const[authErr,setAuthErr]=useState('');
  const[loading,setLoading]=useState(false);

  const handleGoogleResult=(w:any,token:string)=>{
    const wr=w.writer||w;
    p.update({writer:{id:wr.id,username:wr.username,writer_name:wr.writer_name,avatar_url:wr.avatar_url||undefined,bio:wr.bio||undefined},writerToken:token});
    fetchFollowedWriters(p.state.deviceId).then(fw=>p.update({followedWriters:(fw||[]) as any})).catch(()=>{});
  };
  const[studioTab,setStudioTab]=useState<'dashboard'|'stories'|'profile'|'notifications'|'followers'>('dashboard');
  const[unreadCount,setUnreadCount]=useState(0);
  const[showLogoutConfirm,setShowLogoutConfirm]=useState(false);
  const[showDeleteConfirm,setShowDeleteConfirm]=useState(false);
  const[deletingAccount,setDeletingAccount]=useState(false);
  const[isOnline,setIsOnline]=useState(true);
  const[checkingNet,setCheckingNet]=useState(true);
  const t=p.theme;
  const isLoggedIn=Boolean(p.state.writer);
  const token=p.state.writerToken||'';
  const lang=p.state.settings.language;

  useEffect(()=>{
    if(!isLoggedIn||!token)return;
    fetchWriterNotifications(token).then(n=>{
      if(n)setUnreadCount(n.filter(x=>!x.is_read).length);
    }).catch(()=>{});
  },[isLoggedIn,token,studioTab]);

  useEffect(()=>{
    if(!isLoggedIn)return;
    const checkNet=async()=>{
      try{
        const r=await fetch('https://lekhoni-admin-api.smdkawsar2.workers.dev/api/public/books',{method:'GET',cache:'no-store'});
        setIsOnline(r.ok);
      }catch{setIsOnline(false)}
      setCheckingNet(false);
    };
    checkNet();
    const iv=setInterval(checkNet,8000);
    return()=>clearInterval(iv);
  },[isLoggedIn]);

  const handleAuth=async()=>{
    if(!form.password){setAuthErr(tr(p,'allFieldsRequired'));return}
    if(authTab==='register'){
      if(!form.username.trim()||!form.writerName.trim()||!form.email.trim()){setAuthErr(tr(p,'allFieldsRequired'));return}
      if(!privacyConsent){setAuthErr(lang==='bn'?'গোপনীয়তা নীতি মেনে নিন':lang==='hi'?'गोपनीयता नीति स्वीकार करें':'Please agree to Privacy Policy');return}
    }else{
      if(!form.email.trim()){setAuthErr(tr(p,'allFieldsRequired'));return}
    }
    setLoading(true);setAuthErr('');
    try{
      if(authTab==='register'){
        const w=await writerSignup(form.username.trim(),form.writerName.trim(),form.email.trim(),form.password);
        if(w){p.update({writer:{id:w.writer.id,username:w.writer.username,writer_name:w.writer.writer_name,avatar_url:w.writer.avatar_url||undefined,bio:w.writer.bio||undefined},writerToken:w.token});setForm({username:'',writerName:'',email:'',password:''});
          fetchFollowedWriters(p.state.deviceId).then(fw=>p.update({followedWriters:fw as any})).catch(()=>{});}
        else{setAuthErr(tr(p,'accountExists'))}
      }else{
        const w=await writerLogin(form.email.trim(),form.password);
        if(w){p.update({writer:{id:w.writer.id,username:w.writer.username,writer_name:w.writer.writer_name,avatar_url:w.writer.avatar_url||undefined,bio:w.writer.bio||undefined},writerToken:w.token});setForm({username:'',writerName:'',email:'',password:''});
          fetchFollowedWriters(p.state.deviceId).then(fw=>p.update({followedWriters:fw as any})).catch(()=>{});}
        else setAuthErr(tr(p,'wrongCredentials'))
      }
    }catch{setAuthErr(tr(p,'networkError'))}finally{setLoading(false)}
  };

  if(!isLoggedIn)return <KeyboardAvoidingView style={{flex:1,backgroundColor:t.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
    <ScrollView contentContainerStyle={{flexGrow:1,padding:22,paddingTop:50}} keyboardShouldPersistTaps="handled">
    <View style={{alignItems:'center',marginBottom:24}}>
      <Image source={require('./assets/adaptive-icon.png')} style={{width:72,height:72,borderRadius:18}} resizeMode="contain"/>
      <T style={{color:t.ink,fontSize:20,fontWeight:'600',marginTop:14,textAlign:'center'}}>{tr(p,'welcomeWriter')}</T>
      <T style={{color:t.muted,fontSize:13,marginTop:4,textAlign:'center'}}>{tr(p,'storiesWaiting')}</T>
    </View>
    <View style={{backgroundColor:t.card,borderRadius:18,padding:20,marginBottom:16,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',backgroundColor:t.bg,borderRadius:12,padding:3,marginBottom:18}}>
        <Pressable onPress={()=>{setAuthTab('login');setAuthErr('')}} style={{flex:1,borderRadius:10,paddingVertical:10,alignItems:'center',backgroundColor:authTab==='login'?t.primary:'transparent'}}><T style={{color:authTab==='login'?'#fff':t.muted,fontWeight:'600',fontSize:13}}>{tr(p,'login')}</T></Pressable>
        <Pressable onPress={()=>{setAuthTab('register');setAuthErr('')}} style={{flex:1,borderRadius:10,paddingVertical:10,alignItems:'center',backgroundColor:authTab==='register'?t.primary:'transparent'}}><T style={{color:authTab==='register'?'#fff':t.muted,fontWeight:'600',fontSize:13}}>{tr(p,'register')}</T></Pressable>
      </View>
      {authTab==='register'&&<>
      <View style={{marginBottom:12}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{tr(p,'username')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="at-sign" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.username} onChangeText={v=>setForm({...form,username:v})} placeholder={tr(p,'username')} placeholderTextColor={t.muted+'88'} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400',fontFamily:GF()}}/>
        </View>
      </View>
      <View style={{marginBottom:12}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{tr(p,'writerName')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="feather" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.writerName} onChangeText={v=>setForm({...form,writerName:v})} placeholder={tr(p,'writerName')} placeholderTextColor={t.muted+'88'} style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400',fontFamily:GF()}}/>
        </View>
      </View>
      </>}
      <View style={{marginBottom:12}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{authTab==='login'?tr(p,'emailOrUsername'):tr(p,'email')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="user" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.email} onChangeText={v=>setForm({...form,email:v})} placeholder={authTab==='login'?tr(p,'emailOrUsername'):tr(p,'email')} placeholderTextColor={t.muted+'88'} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400',fontFamily:GF()}}/>
        </View>
      </View>
      <View style={{marginBottom:authErr?8:16}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{tr(p,'password')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="lock" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.password} onChangeText={v=>setForm({...form,password:v})} placeholder={tr(p,'password')} placeholderTextColor={t.muted+'88'} secureTextEntry style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400',fontFamily:GF()}}/>
        </View>
      </View>
      {authTab==='register'&&<Pressable onPress={()=>setPrivacyConsent(!privacyConsent)} style={{flexDirection:'row',alignItems:'flex-start',gap:8,marginBottom:14,marginTop:2}}>
        <View style={{width:20,height:20,borderRadius:6,borderWidth:1.5,borderColor:privacyConsent?t.primary:t.line,backgroundColor:privacyConsent?t.primary:'transparent',alignItems:'center',justifyContent:'center',marginTop:1}}>
          {privacyConsent&&<Feather name="check" size={12} color="#fff"/>}
        </View>
        <T style={{fontSize:12,color:t.muted,flex:1,lineHeight:18}}>{tr(p,'agreeToPrivacy')}{' '}
          <T onPress={()=>p.setScreen({type:'terms'})} style={{color:t.primary,fontWeight:'700',textDecorationLine:'underline'}}>{tr(p,'privacyPolicyLink')}</T>
        </T>
      </Pressable>}
      {authErr?<View style={{backgroundColor:'#FEF2F2',borderRadius:10,padding:10,marginBottom:12,flexDirection:'row',alignItems:'center',gap:6}}><Feather name="alert-circle" size={14} color="#EF4444"/><T style={{color:'#EF4444',fontSize:12,fontWeight:'500',flex:1}}>{authErr}</T></View>:null}
      <Pressable disabled={loading} onPress={handleAuth} style={{backgroundColor:t.primary,borderRadius:12,height:46,alignItems:'center',justifyContent:'center',opacity:loading?0.6:1}}>
        {loading?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'600',fontSize:14}}>{authTab==='register'?tr(p,'createAccount'):tr(p,'login')}</T>}
      </Pressable>
      <View style={{flexDirection:'row',alignItems:'center',marginVertical:16}}>
        <View style={{flex:1,height:1,backgroundColor:t.line}}/>
        <T style={{color:t.muted,fontSize:12,marginHorizontal:12}}>{tr(p,'or')}</T>
        <View style={{flex:1,height:1,backgroundColor:t.line}}/>
      </View>
      <GoogleSignInButton onResult={handleGoogleResult} onError={setAuthErr} theme={t} lang={lang}/>
      <T style={{color:t.muted,fontSize:12,textAlign:'center',marginTop:14}}>
        {authTab==='login'?tr(p,'noAccount'):tr(p,'alreadyAccount')}{' '}
        <T onPress={()=>{setAuthTab(authTab==='login'?'register':'login');setAuthErr('')}} style={{color:t.primary,fontWeight:'600'}}>
          {authTab==='login'?tr(p,'registerHere'):tr(p,'loginHere')}</T>
      </T>
    </View>
    </ScrollView>
  </KeyboardAvoidingView>;

  const tabs:[string,string,string][]=[['dashboard',tr(p,'dashboard'),'bar-chart-2'],['stories',tr(p,'myStories'),'book-open'],['profile',tr(p,'profile'),'user']];

  return <Page theme={t}>
    {p.isOffline&&<OfflineBanner theme={t} onRetry={()=>p.syncRemote?.()}/>}
    <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:16,padding:14,marginBottom:16,borderWidth:1,borderColor:t.line}}>
      {p.state.writer?.avatar_url?<Image source={{uri:p.state.writer.avatar_url}} style={{width:48,height:48,borderRadius:24}}/>:<View style={{width:48,height:48,borderRadius:24,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',elevation:3,shadowColor:t.primary,shadowOffset:{width:0,height:3},shadowOpacity:0.25,shadowRadius:6}}>
        <T style={{fontSize:20,fontWeight:'900',color:'#fff'}}>{p.state.writer?.writer_name?.[0]?.toUpperCase()||'?'}</T>
      </View>}
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:17,fontWeight:'900',color:t.ink}}>{p.state.writer?.writer_name}</T>
        <T style={{fontSize:12,color:t.muted,marginTop:1}}>{tr(p,'writerStudio')}</T>
      </View>
      <Pressable onPress={()=>{setStudioTab('notifications');setUnreadCount(0)}} style={{width:40,height:40,borderRadius:12,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:8}}>
        <Feather name="bell" size={18} color={t.primary}/>
        {unreadCount>0&&<View style={{position:'absolute',top:-3,right:-3,backgroundColor:'#EF4444',borderRadius:8,minWidth:16,height:16,alignItems:'center',justifyContent:'center',paddingHorizontal:4}}>
          <T style={{color:'#fff',fontSize:9,fontWeight:'900'}}>{unreadCount>9?'9+':unreadCount}</T>
        </View>}
      </Pressable>
      <Pressable onPress={()=>setShowLogoutConfirm(true)} style={{width:36,height:36,borderRadius:10,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="log-out" size={16} color={t.primary}/>
      </Pressable>
    </View>
    {!checkingNet&&!isOnline?<View style={{alignItems:'center',paddingTop:60,paddingHorizontal:30}}>
      <Svg width={100} height={100} viewBox="0 0 100 100" fill="none">
        <Circle cx="50" cy="50" r="48" stroke={t.line} strokeWidth="2" strokeDasharray="6 4"/>
        <Path d="M30 55 C30 55 35 35 50 35 C65 35 70 55 70 55" stroke={t.muted} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <Path d="M22 62 C22 62 30 42 50 42 C70 42 78 62 78 62" stroke={t.muted} strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.5}/>
        <Line x1="50" y1="62" x2="50" y2="72" stroke={t.muted} strokeWidth="2.5" strokeLinecap="round"/>
        <Circle cx="50" cy="78" r="2.5" fill={t.muted}/>
        <Line x1="25" y1="30" x2="75" y2="80" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
      </Svg>
      <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center',marginTop:20,marginBottom:8}}>
        {lang==='bn'?'ইন্টারনেট সংযোগ নেই':lang==='hi'?'इंटरनेट कनेक्शन नहीं है':'No Internet Connection'}
      </T>
      <T style={{fontSize:13,color:t.muted,textAlign:'center',lineHeight:20,marginBottom:24}}>
        {lang==='bn'?'রাইটার স্টুডিওতে আপনার লেখা পরিচালনা করতে একটি সক্রিয় ইন্টারনেট সংযোগের প্রয়োজন। দয়া করে ইন্টারনেট চালু করে আবার চেষ্টা করুন।':
        lang==='hi'?'राइटर स्टूडियो में अपनी लिखावट प्रबंधित करने के लिए एक सक्रिय इंटरनेट कनेक्शन आवश्यक है। कृपया इंटरनेट चालू करें और पुनः प्रयास करें।':
        'An active internet connection is required to manage your writing in Writer Studio. Please turn on the internet and try again.'}
      </T>
      <Pressable onPress={()=>{setCheckingNet(true);const c=async()=>{try{const r=await fetch('https://lekhoni-admin-api.smdkawsar2.workers.dev/api/public/books',{method:'GET',cache:'no-store'});setIsOnline(r.ok)}catch{setIsOnline(false)}setCheckingNet(false)};c()}} style={{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:t.primary,borderRadius:14,paddingHorizontal:24,paddingVertical:12}}>
        <Feather name="refresh-cw" size={16} color="#fff"/>
        <T style={{color:'#fff',fontWeight:'800',fontSize:14}}>
          {lang==='bn'?'আবার চেষ্টা করুন':lang==='hi'?'पुनः प्रयास करें':'Try Again'}
        </T>
      </Pressable>
    </View>
    :<>
    <View style={{flexDirection:'row',gap:5,marginBottom:18}}>
      {tabs.map(([key,label,icon])=><Pressable key={key} onPress={()=>{setStudioTab(key as any);if(key==='notifications')setUnreadCount(0)}} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,backgroundColor:studioTab===key?t.primary:t.card,borderRadius:10,paddingVertical:9,borderWidth:1,borderColor:studioTab===key?t.primary:t.line}}>
        <Feather name={icon as any} size={13} color={studioTab===key?'#fff':t.muted}/>
        <T style={{color:studioTab===key?'#fff':t.muted,fontWeight:'800',fontSize:11}}>{label}</T>
        {key==='notifications'&&unreadCount>0&&<View style={{backgroundColor:studioTab===key?'rgba(255,255,255,0.3)':'#EF4444',borderRadius:6,minWidth:14,height:14,alignItems:'center',justifyContent:'center',paddingHorizontal:3}}>
          <T style={{color:'#fff',fontSize:8,fontWeight:'900'}}>{unreadCount>9?'9+':unreadCount}</T>
        </View>}
      </Pressable>)}
    </View>
    {studioTab==='dashboard'&&<WriterDashboard token={token} theme={t} lang={lang}/>}
    {studioTab==='stories'&&<WriterStories token={token} theme={t} lang={lang} categories={p.allCategories.map(c=>c[0])} setScreen={p.setScreen} onRefresh={p.syncRemote}/>}
    {studioTab==='profile'&&<WriterProfileStudio token={token} theme={t} writer={p.state.writer} lang={lang} onUpdate={(patch)=>p.update({writer:{...p.state.writer!,...patch}})} onDeleteAccount={()=>setShowDeleteConfirm(true)}/>}
    {studioTab==='notifications'&&<WriterNotifs token={token} theme={t} lang={lang} deviceID={p.state.deviceId} p={p}/>}
    </>}
    {showLogoutConfirm&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24,zIndex:999}}>
      <View style={{width:'100%',backgroundColor:t.card,borderRadius:22,padding:24,alignItems:'center',borderWidth:1,borderColor:t.line}}>
        <View style={{width:56,height:56,borderRadius:28,backgroundColor:'#FEE2E2',alignItems:'center',justifyContent:'center',marginBottom:16}}>
          <Feather name="log-out" size={28} color="#EF4444"/>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center',marginBottom:8}}>লগ আউট করবেন?</T>
        <T style={{fontSize:13,color:t.muted,textAlign:'center',lineHeight:20,marginBottom:20}}>
          {lang==='bn'?'আপনি রাইটার স্টুডিও থেকে লগ আউট করতে চাচ্ছেন। লগ আউট করলে আপনাকে আবার লগইন করতে হবে।':
          lang==='hi'?'आप राइटर स्टूडियो से लॉग आउट करने जा रहे हैं। लॉग आउट करने के बाद आपको फिर से लॉगिन करना होगा।':
          'You are about to log out from Writer Studio. You will need to log in again.'}
        </T>
        <View style={{flexDirection:'row',gap:10,width:'100%'}}>
          <Pressable onPress={()=>setShowLogoutConfirm(false)} style={{flex:1,height:48,borderRadius:14,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
            <T style={{color:t.primary,fontWeight:'800',fontSize:14}}>{lang==='bn'?'বাতিল':lang==='hi'?'रद्द करें':'Cancel'}</T>
          </Pressable>
          <Pressable onPress={()=>{setShowLogoutConfirm(false);p.update({writer:null,writerToken:null,followedWriters:[]})}} style={{flex:1,height:48,borderRadius:14,backgroundColor:'#EF4444',alignItems:'center',justifyContent:'center'}}>
            <T style={{color:'#fff',fontWeight:'800',fontSize:14}}>{lang==='bn'?'হ্যাঁ, লগ আউট':lang==='hi'?'हाँ, लॉग आउट':'Yes, Log out'}</T>
          </Pressable>
        </View>
      </View>
    </View>}
    {showDeleteConfirm&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24,zIndex:999}}>
      <View style={{width:'100%',backgroundColor:t.card,borderRadius:22,padding:24,alignItems:'center',borderWidth:1,borderColor:t.line}}>
        <View style={{width:56,height:56,borderRadius:28,backgroundColor:'#FEE2E2',alignItems:'center',justifyContent:'center',marginBottom:16}}>
          <Feather name="trash-2" size={28} color="#EF4444"/>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center',marginBottom:8}}>{lang==='bn'?'অ্যাকাউন্ট মুছে ফেলবেন?':lang==='hi'?'खाता हटाएँ?':'Delete Account?'}</T>
        <T style={{fontSize:13,color:t.muted,textAlign:'center',lineHeight:20,marginBottom:20}}>
          {lang==='bn'?'এটি অপরিবর্তনীয়! আপনার সমস্ত গল্প, অনুসারক এবং অ্যাকাউন্ট তথ্য মুছে ফেলা হবে।':
          lang==='hi'?'यह अपरिवर्तनीय है! आपकी सभी कहानियाँ, अनुयायी और खाता जानकारी हटा दी जाएगी।':
          'This is irreversible! All your stories, followers and account data will be deleted.'}
        </T>
        <View style={{flexDirection:'row',gap:10,width:'100%'}}>
          <Pressable onPress={()=>setShowDeleteConfirm(false)} style={{flex:1,height:48,borderRadius:14,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
            <T style={{color:t.primary,fontWeight:'800',fontSize:14}}>{lang==='bn'?'বাতিল':lang==='hi'?'रद्द करें':'Cancel'}</T>
          </Pressable>
          <Pressable onPress={async()=>{setDeletingAccount(true);const r=await deleteWriterAccount(token);setDeletingAccount(false);if(r.ok){setShowDeleteConfirm(false);p.update({writer:null,writerToken:null,followedWriters:[]})}else{Alert.alert('',r.error||'Failed')}}} disabled={deletingAccount} style={{flex:1,height:48,borderRadius:14,backgroundColor:'#EF4444',alignItems:'center',justifyContent:'center',opacity:deletingAccount?0.6:1}}>
            {deletingAccount?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:14}}>{lang==='bn'?'হ্যাঁ, মুছুন':lang==='hi'?'हाँ, हटाएँ':'Yes, Delete'}</T>}
          </Pressable>
        </View>
      </View>
    </View>}
  </Page>}

function DashStat({c,i,t}:{c:{icon:string;label:string;value:number;color:string;bg:string};i:number;t:Theme}){
  const animVal=useRef(new Animated.Value(0)).current;
  const bounce=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.sequence([Animated.timing(animVal,{toValue:1,duration:500,useNativeDriver:true,delay:i*120}),Animated.spring(bounce,{toValue:1,friction:3,tension:120,useNativeDriver:true})]).start()},[]);
  const scale=animVal.interpolate({inputRange:[0,1],outputRange:[0.7,1]});
  const opacity=animVal.interpolate({inputRange:[0,1],outputRange:[0,1]});
  const iconScale=bounce.interpolate({inputRange:[0,1],outputRange:[0.3,1]});
  const dark=shade(c.color,-40);
  const darker=shade(c.color,-55);
  const fp=(x:number,y:number,op:number)=><><Ellipse cx={x} cy={y-4} rx={3} ry={6} fill="#fff" opacity={op}/><Ellipse cx={x-4} cy={y} rx={6} ry={3} fill="#fff" opacity={op}/><Ellipse cx={x+4} cy={y} rx={6} ry={3} fill="#fff" opacity={op}/><Ellipse cx={x} cy={y+4} rx={3} ry={6} fill="#fff" opacity={op}/><Circle cx={x} cy={y} r={2} fill="#fff" opacity={op+0.05}/></>;
  return <Animated.View style={{width:'47%',height:120,borderRadius:20,overflow:'hidden',position:'relative',transform:[{scale}],opacity,shadowColor:c.color,shadowOpacity:0.3,shadowRadius:12,shadowOffset:{width:0,height:6},elevation:6}}>
    <View style={{position:'absolute',top:0,left:0,right:0,bottom:0}}>
      <LinearGradient colors={[dark,darker]} start={{x:0,y:0}} end={{x:1,y:1}} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
      <Svg style={{position:'absolute',top:0,left:0,right:0,bottom:0}} viewBox="0 0 170 120" preserveAspectRatio="none">
        <Ellipse cx="155" cy="10" rx="55" ry="45" fill="#fff" opacity="0.08"/>
        <Ellipse cx="20" cy="110" rx="50" ry="40" fill="#fff" opacity="0.06"/>
        <Circle cx="85" cy="60" r="70" fill="#fff" opacity="0.04"/>
        {fp(12,12,0.15)}
        {fp(158,12,0.12)}
        {fp(12,108,0.12)}
        {fp(158,108,0.15)}
      </Svg>
    </View>
    <View style={{position:'relative',zIndex:2,flex:1,alignItems:'center',justifyContent:'center',padding:14}}>
      <Animated.View style={{transform:[{scale:iconScale}],marginBottom:8}}>
        <View style={{width:32,height:32,borderRadius:10,backgroundColor:'#ffffff20',alignItems:'center',justifyContent:'center'}}>
          <Feather name={c.icon as any} size={15} color="#fff"/>
        </View>
      </Animated.View>
      <T style={{fontSize:26,fontWeight:'900',color:'#fff',lineHeight:30}}>{c.value}</T>
      <T style={{fontSize:10,fontWeight:'700',color:'#ffffffBB',marginTop:3}}>{c.label}</T>
    </View>
  </Animated.View>
}

function WriterDashboard({token,theme:t,lang}:{token:string;theme:Theme;lang:Language}){
  const[d,setD]=useState<any>({stories:0,totalViews:0,followers:0,published:0,pending:0,publishedStories:[],todayViews:0,weekViews:0,monthViews:0});
  const[loading,setLoading]=useState(true);
  useEffect(()=>{fetchWriterDashboard(token).then(s=>{if(s){const ps=s.publishedStories||[];const now=Date.now();const dayMs=86400000;const computedTotal=ps.reduce((sum:number,st:any)=>sum+(st.views||0),0);const computedToday=ps.filter((st:any)=>new Date(st.updated_at).getTime()>now-dayMs).reduce((sum:number,st:any)=>sum+(st.views||0),0);const computedWeek=ps.filter((st:any)=>new Date(st.updated_at).getTime()>now-7*dayMs).reduce((sum:number,st:any)=>sum+(st.views||0),0);const computedMonth=ps.filter((st:any)=>new Date(st.updated_at).getTime()>now-30*dayMs).reduce((sum:number,st:any)=>sum+(st.views||0),0);s.totalViews=Math.max(s.totalViews||0,computedTotal);s.todayViews=Math.max(s.todayViews||0,computedToday);s.weekViews=Math.max(s.weekViews||0,computedWeek);s.monthViews=Math.max(s.monthViews||0,computedMonth);setD(s)}}).finally(()=>setLoading(false))},[token]);
  if(loading)return <View style={{alignItems:'center',paddingVertical:60}}><ActivityIndicator size="large" color={t.primary}/></View>;
  const isEligible=d.followers>=1000&&d.totalViews>=5000;
  const statCards=[
    {icon:'book-open',label:copy(lang,'myStories'),value:d.stories,color:'#059669',bg:'linear'},
    {icon:'eye',label:copy(lang,'totalViews'),value:d.totalViews,color:'#4F46E5',bg:'radial'},
    {icon:'users',label:copy(lang,'followers'),value:d.followers,color:'#DB2777',bg:'wave'},
    {icon:'check-circle',label:copy(lang,'published'),value:d.published,color:'#D97706',bg:'dots'}
  ];
  return <ScrollView showsVerticalScrollIndicator={false}>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:14}}>
      {statCards.map((c,i)=><DashStat key={i} c={c} i={i} t={t}/>)}
    </View>
    {d.pending>0&&<View style={{backgroundColor:'#FEF3C7',borderRadius:12,padding:12,marginBottom:14,flexDirection:'row',alignItems:'center',gap:8}}>
      <Feather name="clock" size={16} color="#D97706"/>
      <T style={{fontSize:12,fontWeight:'700',color:'#92400E',flex:1}}>{d.pending} {copy(lang,'pendingReview')}</T>
    </View>}
    <View style={{backgroundColor:t.card,borderRadius:16,padding:14,marginBottom:14,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}>
        <View style={{width:32,height:32,borderRadius:8,backgroundColor:'#6366F118',alignItems:'center',justifyContent:'center'}}><Feather name="bar-chart-2" size={16} color="#6366F1"/></View>
        <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>{copy(lang,'viewsAnalytics')}</T>
      </View>
      <View style={{flexDirection:'row',gap:8}}>
        {[{label:copy(lang,'today'),value:d.todayViews,color:'#10B981'},{label:copy(lang,'thisWeek'),value:d.weekViews,color:'#6366F1'},{label:copy(lang,'thisMonth'),value:d.monthViews,color:'#F59E0B'}].map((v,i)=>
        <View key={i} style={{flex:1,backgroundColor:v.color+'12',borderRadius:10,padding:10,alignItems:'center'}}>
          <T style={{fontSize:18,fontWeight:'900',color:v.color}}>{v.value}</T>
          <T style={{fontSize:9,fontWeight:'700',color:v.color,marginTop:2}}>{v.label}</T>
        </View>)}
      </View>
    </View>
    {d.publishedStories?.length>0&&<View style={{backgroundColor:t.card,borderRadius:16,padding:14,marginBottom:14,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}>
        <View style={{width:32,height:32,borderRadius:8,backgroundColor:t.primary+'18',alignItems:'center',justifyContent:'center'}}><Feather name="book-open" size={16} color={t.primary}/></View>
        <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>{copy(lang,'publishedStories')}</T>
      </View>
      {d.publishedStories.map((s:any,i:number)=>
      <View key={s.id} style={{paddingVertical:12,borderBottomWidth:i<d.publishedStories.length-1?1:0,borderBottomColor:t.line}}>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          {s.cover_url?<Image source={{uri:s.cover_url}} style={{width:40,height:30,borderRadius:6,marginRight:10}}/>:
          <View style={{width:40,height:30,borderRadius:6,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:10}}><Feather name="book" size={12} color={t.muted}/></View>}
          <View style={{flex:1}}>
            <T numberOfLines={1} style={{fontSize:13,fontWeight:'700',color:t.ink}}>{s.title}</T>
          </View>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',gap:12,marginTop:8,marginLeft:50}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
            <Feather name="eye" size={11} color="#10B981"/>
            <T style={{fontSize:10,fontWeight:'700',color:t.muted}}>{s.views||0} পাঠক</T>
          </View>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
            <Feather name="thumbs-up" size={11} color="#6366F1"/>
            <T style={{fontSize:10,fontWeight:'700',color:t.muted}}>{s.likes||0} লাইক</T>
          </View>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
            <Feather name="message-circle" size={11} color="#F59E0B"/>
            <T style={{fontSize:10,fontWeight:'700',color:t.muted}}>{s.comment_count||0} কমেন্ট</T>
          </View>
        </View>
    </View>)}
  </View>}
    <View style={{backgroundColor:t.card,borderRadius:16,padding:16,marginBottom:20,borderWidth:1,borderColor:isEligible?'#10B981':t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:14}}>
        <View style={{width:40,height:40,borderRadius:12,backgroundColor:isEligible?'#10B981'+'18':'#F59E0B'+'18',alignItems:'center',justifyContent:'center'}}>
          {isEligible?<Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#10B981"/></Svg>:
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke="#F59E0B" strokeWidth="2"/><Path d="M12 6V12L16 14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/></Svg>}
        </View>
        <View style={{flex:1}}>
          <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>{copy(lang,'monetization')}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:2}}>{isEligible?copy(lang,'eligibleForMonetization'):copy(lang,'monetizationProgress')}</T>
        </View>
      </View>
      {!isEligible&&<View style={{marginBottom:14}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
          <T style={{fontSize:11,fontWeight:'600',color:t.muted}}>{copy(lang,'followers')}: {d.followers}/1,000</T>
          <T style={{fontSize:11,fontWeight:'700',color:d.followers>=1000?'#10B981':t.muted}}>{Math.min(100,Math.floor(d.followers/10))}%</T>
        </View>
        <View style={{height:6,backgroundColor:t.line,borderRadius:3,overflow:'hidden'}}>
          <View style={{height:6,flex:Math.min(100,Math.floor(d.followers/10))/100,maxWidth:'100%',backgroundColor:d.followers>=1000?'#10B981':t.primary,borderRadius:3}}/>
        </View>
        <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:8,marginBottom:6}}>
          <T style={{fontSize:11,fontWeight:'600',color:t.muted}}>{copy(lang,'totalViews')}: {d.totalViews}/5,000</T>
          <T style={{fontSize:11,fontWeight:'700',color:d.totalViews>=5000?'#10B981':t.muted}}>{Math.min(100,Math.floor(d.totalViews/50))}%</T>
        </View>
        <View style={{height:6,backgroundColor:t.line,borderRadius:3,overflow:'hidden'}}>
          <View style={{height:6,flex:Math.min(100,Math.floor(d.totalViews/50))/100,maxWidth:'100%',backgroundColor:d.totalViews>=5000?'#10B981':'#6366F1',borderRadius:3}}/>
        </View>
      </View>}
      <View style={{backgroundColor:t.tint,borderRadius:10,padding:12}}>
        <T style={{fontSize:11,fontWeight:'700',color:t.ink,marginBottom:6}}>{copy(lang,'howMonetizationWorks')}</T>
        <T style={{fontSize:10,color:t.muted,lineHeight:16}}>
          {copy(lang,'monetizationDesc1')+'\n\n'+
          copy(lang,'monetizationDesc2')+'\n\n'+
          copy(lang,'monetizationDesc3')}
        </T>
      </View>
    </View>
  </ScrollView>}

function NewStoryScreen({token,theme:t,lang,categories,onBack,onCreated,initialMode}:{token:string;theme:Theme;lang:Language;categories:string[];onBack:()=>void;onCreated:()=>void;initialMode?:'text'|'pdf'}){
  const insets=useSafeAreaInsets();
  const[mode,setMode]=useState<'text'|'pdf'|null>(initialMode||null);
  const[title,setTitle]=useState('');
  const[desc,setDesc]=useState('');
  const[cover,setCover]=useState('');
  const[coverPreview,setCoverPreview]=useState('');
  const[category,setCategory]=useState('');
  const[catOpen,setCatOpen]=useState(false);
  const[displayStatus,setDisplayStatus]=useState<'complete'|'ongoing'>('ongoing');
  const[saving,setSaving]=useState(false);
  const[uploadingImg,setUploadingImg]=useState(false);
  const[coverError,setCoverError]=useState<'failed'|'noInternet'|null>(null);
  const[showNewCat,setShowNewCat]=useState(false);
  const[newCatName,setNewCatName]=useState('');
  const[localCats,setLocalCats]=useState<string[]>(categories);
  const[chTitle,setChTitle]=useState('');
  const[chBody,setChBody]=useState('');
  const[showPreview,setShowPreview]=useState(false);
  const[hideTitle,setHideTitle]=useState(false);
  const[pdfFile,setPdfFile]=useState<{uri:string;name:string}|null>(null);
  const[uploadingPdf,setUploadingPdf]=useState(false);
  const[dedication,setDedication]=useState('');
  const[authorName,setAuthorName]=useState('');
  const TITLE_MAX=60;const DESC_MAX=500;
  const missingFields:string[]=[];
  if(mode!=='pdf'&&!title.trim())missingFields.push(copy(lang,'storyTitle'));
  if(mode==='text'&&!chTitle.trim()&&!chBody.trim())missingFields.push(copy(lang,'firstChapter'));
  if(mode==='pdf'&&!pdfFile)missingFields.push('PDF ফাইল');
  if(!category&&localCats.length>0)missingFields.push(copy(lang,'selectCategory'));
  const canPublish=missingFields.length===0;
  const pickCover=async()=>{setUploadingImg(true);setCoverError(null);try{const url=await pickAndResizeImage('cover');if(url){setCover(url);setCoverPreview(url)}else{setCoverError('failed')}}catch(e:any){if(e?.message?.includes('Network')||e?.message?.includes('fetch'))setCoverError('noInternet');else setCoverError('failed')}finally{setUploadingImg(false)}};
  const pickPdf=async()=>{try{const r=await DocumentPicker.getDocumentAsync({type:'application/pdf',copyToCacheDirectory:true});if(!r.canceled&&r.assets?.length){setPdfFile({uri:r.assets[0].uri,name:r.assets[0].name})}}catch{}};
  const handleCreate=async()=>{
    if(!canPublish)return;setSaving(true);
    const finalTitle=(mode==='pdf'&&!title.trim()&&pdfFile)?pdfFile.name.replace(/\.pdf$/i,''):title.trim();
    let pdfUrl='';
    if(mode==='pdf'&&pdfFile){
      setUploadingPdf(true);
      try{const uploaded=await uploadWriterPdf(token,pdfFile.uri,pdfFile.name);if(uploaded)pdfUrl=uploaded;else{Alert.alert('ত্রুটি','PDF আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');setUploadingPdf(false);setSaving(false);return}}catch{Alert.alert('ত্রুটি','PDF আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');setUploadingPdf(false);setSaving(false);return}
      setUploadingPdf(false);
    }
    const r=await createWriterStory(token,finalTitle,desc.trim(),category||localCats[0]||'',cover||undefined,mode==='pdf'?'complete':(displayStatus==='ongoing'?'ongoing':'complete'),mode==='pdf'?'complete':(displayStatus==='ongoing'?'ongoing':'complete'),hideTitle,pdfUrl,dedication,authorName);
    if(r){
      if(mode==='text'&&chTitle.trim()&&chBody.trim())await createStoryChapter(token,r.id,chTitle.trim(),chBody.trim());
      onCreated();
    }else{Alert.alert('ত্রুটি','গল্প তৈরি ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')}
    setSaving(false);
  };
  const addNewCat=()=>{if(newCatName.trim()&&!localCats.includes(newCatName.trim())){setLocalCats(c=>[...c,newCatName.trim()]);setCategory(newCatName.trim());setNewCatName('');setShowNewCat(false)}};
  const fmtCover=():React.ReactNode=>{
    if(!coverPreview)return <View style={{width:80,height:110,borderRadius:10,backgroundColor:t.primary+'22',alignItems:'center',justifyContent:'center'}}><Feather name="book-open" size={22} color={t.primary}/></View>;
    if(hideTitle)return <Image source={{uri:coverPreview}} style={{width:80,height:110,borderRadius:10}} resizeMode="cover"/>;
    return <View style={{width:80,height:110,borderRadius:10,overflow:'hidden',backgroundColor:'#4A1220'}}><Image source={{uri:coverPreview}} style={{position:'absolute',top:0,left:0,right:0,bottom:0}} resizeMode="cover"/><View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.2)'}}/><Feather name="book-open" size={18} color="#C9972B" style={{position:'absolute',top:10,left:10}}/><T numberOfLines={2} style={{position:'absolute',bottom:10,left:10,right:10,color:'#fff',fontWeight:'900',fontSize:11,lineHeight:14}}>{title||'...'}</T></View>;
  };
  return <View style={{flex:1,backgroundColor:t.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      <Pressable onPress={onBack} style={{flexDirection:'row',alignItems:'center',gap:4}}>
        <Feather name="arrow-left" size={18} color={t.primary}/>
        <T style={{fontSize:13,fontWeight:'700',color:t.primary}}>{copy(lang,'cancel')}</T>
      </Pressable>
      <View style={{alignItems:'center'}}>
        <Feather name="feather" size={16} color={t.primary}/>
        <T style={{fontSize:10,fontWeight:'800',color:t.primary,marginTop:1}}>{copy(lang,'writeStudio')}</T>
      </View>
      <Pressable disabled={saving||uploadingPdf||!canPublish} onPress={handleCreate} style={{backgroundColor:t.primary,borderRadius:8,paddingHorizontal:12,paddingVertical:6,opacity:saving||uploadingPdf||!canPublish?0.5:1}}>
        {saving||uploadingPdf?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:11}}>{uploadingPdf?'PDF আপলোড...':copy(lang,'publishStory')}</T>}
      </Pressable>
    </View>
    <ScrollView contentContainerStyle={{padding:14,paddingBottom:50}} keyboardShouldPersistTaps="handled">
      {!mode&&<View style={{marginBottom:20}}>
        <T style={{fontSize:16,fontWeight:'900',color:t.ink,marginBottom:12}}>নতুন গল্প তৈরি করুন</T>
        <View style={{flexDirection:'row',gap:12}}>
          <Pressable onPress={()=>setMode('text')} style={{flex:1,backgroundColor:t.card,borderRadius:14,borderWidth:2,borderColor:t.primary,padding:20,alignItems:'center',gap:10}}>
            <View style={{width:50,height:50,borderRadius:25,backgroundColor:t.primary+'15',alignItems:'center',justifyContent:'center'}}><Feather name="edit-3" size={22} color={t.primary}/></View>
            <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>লিখে দিন</T>
            <T style={{fontSize:11,color:t.muted,textAlign:'center'}}>নিজে লিখে অধ্যায় তৈরি করুন</T>
          </Pressable>
          <Pressable onPress={()=>setMode('pdf')} style={{flex:1,backgroundColor:t.card,borderRadius:14,borderWidth:2,borderColor:'#8B5CF6',padding:20,alignItems:'center',gap:10}}>
            <View style={{width:50,height:50,borderRadius:25,backgroundColor:'#8B5CF6'+'15',alignItems:'center',justifyContent:'center'}}><Feather name="file-text" size={22} color="#8B5CF6"/></View>
            <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>PDF আপলোড</T>
            <T style={{fontSize:11,color:t.muted,textAlign:'center'}}>PDF ফাইল আপলোড করুন</T>
          </Pressable>
        </View>
      </View>}
      {mode&&<Pressable onPress={()=>setMode(null)} style={{flexDirection:'row',alignItems:'center',gap:4,marginBottom:12}}>
        <Feather name="arrow-left" size={14} color={t.primary}/>
        <T style={{fontSize:12,fontWeight:'700',color:t.primary}}>পরিবর্তন করুন</T>
      </Pressable>}
      {!canPublish&&<View style={{backgroundColor:'#FEF3C7',borderRadius:10,padding:12,marginBottom:16,borderWidth:1,borderColor:'#F59E0B',flexDirection:'row',alignItems:'flex-start',gap:8}}>
        <Feather name="alert-circle" size={16} color="#D97706" style={{marginTop:1}}/>
        <View style={{flex:1}}>
          <T style={{fontSize:11,fontWeight:'700',color:'#92400E',marginBottom:3}}>{copy(lang,'fillRequired')}</T>
          <T style={{fontSize:10,color:'#78350F',lineHeight:16}}>{missingFields.join(', ')}</T>
        </View>
      </View>}
      {mode==='text'&&(<>
      <View style={{backgroundColor:t.primary+'0D',borderRadius:10,padding:12,marginBottom:16,borderWidth:1,borderColor:t.primary+'20'}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4}}>
          <Feather name="info" size={14} color={t.primary}/>
          <T style={{fontSize:11,fontWeight:'700',color:t.primary}}>{copy(lang,'guideTitle')}</T>
        </View>
        <T style={{fontSize:11,color:t.muted,lineHeight:17}}>{copy(lang,'guideDesc')}</T>
      </View>
      <View style={{marginBottom:16}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted}}>{copy(lang,'storyTitle')}</T>
          <T style={{fontSize:10,color:title.length>=TITLE_MAX-5?'#EF4444':t.muted}}>{title.length}/{TITLE_MAX}</T>
        </View>
        <TextInput value={title} onChangeText={v=>{if(v.length<=TITLE_MAX)setTitle(v)}} placeholder={lang==='bn'?'\u0986\u09aa\u09A8\u09BE\u09B0 \u0997\u09B2\u09CD\u09AA\u09C7\u09B0 \u09A8\u09BE\u09AE...':lang==='hi'?'\u0905\u092A\u0928\u0940 \u0915\u0939\u093E\u0928\u0940 \u0915\u093E \u0928\u093E\u092E...':'Your story title...'} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:16,fontWeight:'800',backgroundColor:t.card,borderWidth:1.5,borderColor:title.length>=TITLE_MAX-5?'#EF4444':title.length>0?t.primary:t.line,borderRadius:12,padding:12,fontFamily:GF()}}/>
      </View>
      <View style={{marginBottom:16}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted}}>{copy(lang,'storyDesc')}</T>
          {desc.length>0&&<T style={{fontSize:10,color:desc.length>=DESC_MAX-50?'#F59E0B':t.muted}}>{desc.length}/{DESC_MAX}</T>}
        </View>
        <TextInput value={desc} onChangeText={v=>{if(v.length<=DESC_MAX)setDesc(v)}} multiline placeholder={copy(lang,'storyDescHint')} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:13,minHeight:80,maxHeight:150,textAlignVertical:'top',padding:12,fontFamily:GF(),lineHeight:20,backgroundColor:t.card,borderWidth:1,borderColor:desc.length>0?t.primary:t.line,borderRadius:12}}/>
      </View>
      <View style={{marginBottom:16}}>
        <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>{copy(lang,'storyType')}</T>
        <View style={{flexDirection:'row',gap:8}}>
          {([['ongoing',copy(lang,'statusOngoing')],['complete',copy(lang,'statusComplete')]] as const).map(([k,l])=>(
            <Pressable key={k} onPress={()=>setDisplayStatus(k)} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:displayStatus===k?t.primary:t.card,borderWidth:1.5,borderColor:displayStatus===k?t.primary:t.line,borderRadius:10,paddingVertical:10}}>
              <View style={{width:16,height:16,borderRadius:8,borderWidth:2,borderColor:displayStatus===k?'#fff':t.muted,alignItems:'center',justifyContent:'center'}}>
                {displayStatus===k&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:'#fff'}}/>}
              </View>
              <T style={{fontSize:12,fontWeight:'800',color:displayStatus===k?'#fff':t.ink}}>{l}</T>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{marginBottom:16}}>
        <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>{copy(lang,'addCover')}</T>
        <Pressable onPress={pickCover} disabled={uploadingImg} style={{borderRadius:12,borderWidth:1.5,borderColor:coverError?'#EF4444':uploadingImg?t.primary:coverPreview?'#10B981':t.line,borderStyle:'dashed',overflow:'hidden'}}>
          {uploadingImg?<View style={{height:160,alignItems:'center',justifyContent:'center',backgroundColor:t.card,gap:10}}>
            <View style={{width:60,height:60,borderRadius:30,backgroundColor:t.primary+'15',alignItems:'center',justifyContent:'center'}}>
              <ActivityIndicator size="large" color={t.primary}/>
            </View>
            <T style={{fontSize:12,fontWeight:'600',color:t.primary}}>ছবি আপলোড হচ্ছে...</T>
            <View style={{width:120,height:4,borderRadius:2,backgroundColor:t.line,overflow:'hidden'}}><View style={{height:'100%',width:'60%',backgroundColor:t.primary,borderRadius:2}}/></View>
          </View>:
          coverError?<View style={{height:140,alignItems:'center',justifyContent:'center',backgroundColor:t.card,gap:8}}>
            <View style={{width:50,height:50,borderRadius:25,backgroundColor:'#FEE2E2',alignItems:'center',justifyContent:'center'}}><Feather name={coverError==='noInternet'?'wifi-off':'alert-circle'} size={22} color="#EF4444"/></View>
            <T style={{fontSize:13,fontWeight:'700',color:'#EF4444'}}>{coverError==='noInternet'?'ইন্টারনেট নেই':'আপলোড ব্যর্থ'}</T>
            <T style={{fontSize:11,color:t.muted}}>আবার চেষ্টা করুন</T>
          </View>:
          coverPreview?<View style={{height:180,backgroundColor:t.card,alignItems:'center',justifyContent:'center'}}>
            <Image source={{uri:coverPreview}} style={{width:120,height:160,borderRadius:10}} resizeMode="cover"/>
            <View style={{flexDirection:'row',alignItems:'center',gap:5,marginTop:8}}><Feather name="refresh-cw" size={12} color={t.muted}/><T style={{fontSize:11,color:t.muted,fontWeight:'600'}}>{copy(lang,'changePhoto')}</T></View>
          </View>:
          <View style={{height:140,alignItems:'center',justifyContent:'center',gap:8,backgroundColor:t.card}}>
            <View style={{width:50,height:50,borderRadius:25,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}><Feather name="image" size={22} color={t.primary}/></View>
            <T style={{fontSize:12,color:t.muted,fontWeight:'600'}}>{copy(lang,'tapToUpload')}</T>
            <T style={{fontSize:10,color:t.muted}}>2:3 রেশিও (600×900)</T>
          </View>}
        </Pressable>
        {coverPreview&&<Pressable onPress={()=>setHideTitle(!hideTitle)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:10,backgroundColor:t.card,borderRadius:10,padding:10,borderWidth:1,borderColor:t.line}}>
          <View style={{flex:1}}>
            <T style={{fontSize:12,fontWeight:'700',color:t.ink}}>{copy(lang,'hideTitleOnCover')}</T>
            <T style={{fontSize:10,color:t.muted,marginTop:2}}>{copy(lang,'hideTitleHint')}</T>
          </View>
          <View style={{width:44,height:26,borderRadius:13,backgroundColor:hideTitle?t.primary:t.line,alignItems:'center',justifyContent:'center',padding:2}}>
            <View style={{width:22,height:22,borderRadius:11,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',elevation:2,transform:[{translateX:hideTitle?18:0}]}}/>
          </View>
        </Pressable>}
      </View>
      <View style={{marginBottom:16}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted}}>{copy(lang,'firstChapter')}</T>
        </View>
        <TextInput value={chTitle} onChangeText={setChTitle} placeholder={copy(lang,'chapterTitle')} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:14,fontWeight:'700',backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:10,padding:10,marginBottom:8,fontFamily:GF()}}/>
        <View style={{backgroundColor:t.card,borderWidth:1,borderColor:chBody.length>0?t.primary:t.line,borderRadius:12,overflow:'hidden'}}>
          <TextInput value={chBody} onChangeText={setChBody} multiline placeholder={copy(lang,'chapterContentHint')} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:14,minHeight:200,maxHeight:400,textAlignVertical:'top',padding:12,fontFamily:GF(),lineHeight:22}}/>
          {chBody.length>0&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',paddingHorizontal:12,paddingBottom:8}}>
            <T style={{fontSize:10,color:t.muted}}>{chBody.length} {'\u0985\u0995\u09CD\u09B7\u09B0'}</T>
          </View>}
        </View>
      </View>
      <View style={{marginBottom:16}}>
        <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>{copy(lang,'selectCategory')}</T>
        <Pressable onPress={()=>setCatOpen(!catOpen)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:catOpen?t.primary:t.line,borderRadius:10,padding:12,backgroundColor:t.card}}>
          <T style={{fontSize:13,fontWeight:category?'700':'500',color:category?t.ink:t.muted}}>{category||copy(lang,'selectCategory')}</T>
          <Feather name={catOpen?'chevron-up':'chevron-down'} size={16} color={t.muted}/>
        </Pressable>
        {catOpen&&<View style={{borderWidth:1,borderColor:t.line,borderRadius:10,backgroundColor:t.card,maxHeight:160,overflow:'hidden',marginTop:4}}>
          <ScrollView nestedScrollEnabled style={{maxHeight:140}}>
            {localCats.map(c=><Pressable key={c} onPress={()=>{setCategory(c);setCatOpen(false)}} style={{paddingHorizontal:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:t.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <T style={{fontSize:13,fontWeight:category===c?'800':'500',color:category===c?t.primary:t.ink}}>{c}</T>
              {category===c&&<Feather name="check" size={14} color={t.primary}/>}
            </Pressable>)}
          </ScrollView>
          <Pressable onPress={()=>{setShowNewCat(true);setCatOpen(false)}} style={{padding:10,backgroundColor:t.tint,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5}}>
            <Feather name="plus" size={14} color={t.primary}/>
            <T style={{fontSize:11,fontWeight:'800',color:t.primary}}>{'\u09A8\u09A4\u09C1\u09A8 \u09AC\u09BF\u09AD\u09BE\u0997'}</T>
          </Pressable>
        </View>}
        {showNewCat&&<View style={{borderRadius:10,borderWidth:1,borderColor:t.primary,padding:10,marginTop:4,backgroundColor:t.card}}>
          <TextInput value={newCatName} onChangeText={setNewCatName} placeholder={'\u09AC\u09BF\u09AD\u09BE\u0997\u09C7\u09B0 \u09A8\u09BE\u09AE...'} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:12,backgroundColor:t.bg,borderWidth:1,borderColor:t.line,borderRadius:8,padding:8,marginBottom:6,fontFamily:GF()}}/>
          <View style={{flexDirection:'row',gap:6}}>
            <Pressable onPress={()=>{setShowNewCat(false);setNewCatName('')}} style={{flex:1,alignItems:'center',paddingVertical:7,borderRadius:8,backgroundColor:t.tint}}>
              <T style={{fontSize:11,fontWeight:'700',color:t.muted}}>{copy(lang,'cancel')}</T>
            </Pressable>
            <Pressable disabled={!newCatName.trim()} onPress={addNewCat} style={{flex:1,alignItems:'center',paddingVertical:7,borderRadius:8,backgroundColor:newCatName.trim()?t.primary:t.tint,opacity:newCatName.trim()?1:0.5}}>
              <T style={{fontSize:11,fontWeight:'700',color:newCatName.trim()?'#fff':t.muted}}>{copy(lang,'create')}</T>
            </Pressable>
          </View>
        </View>}
      </View>
      <Pressable onPress={()=>setShowPreview(!showPreview)} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:t.tint,borderRadius:10,paddingVertical:10,marginBottom:showPreview?10:0,borderWidth:1,borderColor:t.line}}>
        <Feather name={showPreview?'chevron-up':'eye'} size={16} color={t.primary}/>
        <T style={{fontSize:12,fontWeight:'800',color:t.primary}}>{showPreview?'\u09AA\u09CD\u09B0\u09BF\u09AD\u09BF\u09A8 \u09AC\u09A8\u09CD\u09A7':copy(lang,'previewHome')}</T>
      </Pressable>
      {showPreview&&<View style={{width:130,alignSelf:'center',marginTop:10}}>
        <View style={{position:'relative'}}>
          <View style={{width:124,height:169,borderRadius:9,backgroundColor:'#4A1220',overflow:'hidden',padding:(hideTitle&&coverPreview)?0:11,justifyContent:(hideTitle&&coverPreview)?'flex-start':'flex-end'}}>
            {coverPreview?<Image source={{uri:coverPreview}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:9}} resizeMode="cover"/>:null}
            {!hideTitle&&coverPreview&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:9,backgroundColor:'rgba(0,0,0,0.15)'}}/>}
            {!(hideTitle&&coverPreview)&&<Feather name="book-open" size={20} color="#C9972B"/>}
            {!hideTitle&&<T numberOfLines={3} style={{color:'#fff',fontWeight:'900',fontSize:14,lineHeight:18}}>{title||'...'}</T>}
            {!hideTitle&&<View style={{height:2,width:24,backgroundColor:'#C9972B',marginVertical:7}}/>}
            {!(hideTitle&&coverPreview)&&<T style={{fontSize:8,color:'#FFFFFFAA'}}>{'\u09B2\u09C7\u0996\u0995'}</T>}
          </View>
          {displayStatus==='ongoing'?<View style={{position:'absolute',top:8,left:8,borderRadius:7,paddingVertical:3,paddingHorizontal:7,backgroundColor:'#10B981'}}><T style={{fontSize:9,fontWeight:'900',color:'#fff'}}>{copy(lang,'statusOngoing')}</T></View>:
          displayStatus==='complete'?<View style={{position:'absolute',top:8,left:8,borderRadius:7,paddingVertical:3,paddingHorizontal:7,backgroundColor:'#8B5CF6'}}><T style={{fontSize:9,fontWeight:'900',color:'#fff'}}>{copy(lang,'statusComplete')}</T></View>:null}
        </View>
        <T numberOfLines={2} style={{fontSize:14,fontWeight:'800',color:t.ink,lineHeight:20,marginTop:10}}>{title||'...'}</T>
        <T numberOfLines={1} style={{color:t.muted,fontSize:11}}>{'\u09B2\u09C7\u0996\u0995'}</T>
      </View>}
      </>)}
      {mode==='pdf'&&<View>
        <View style={{marginBottom:16}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>কভার ছবি (ঐচ্ছিক কিন্তু সুন্দর দেখাবে)</T>
          <Pressable onPress={async()=>{try{const url=await pickAndResizeImage('cover');if(url){setCover(url);setCoverPreview(url)}}catch{}}} style={{backgroundColor:t.card,borderWidth:1.5,borderColor:cover?'#10B981':t.line,borderRadius:12,padding:16,flexDirection:'row',alignItems:'center',gap:12}}>
            {coverPreview?<Image source={{uri:coverPreview}} style={{width:50,height:65,borderRadius:8}}/>:<View style={{width:50,height:65,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}><Feather name="image" size={20} color={t.muted}/></View>}
            <View style={{flex:1}}>
              <T style={{fontSize:13,fontWeight:'700',color:cover?'#10B981':t.ink}}>{cover?'কভার আপলোড হয়েছে':'কভার ছবি দিন'}</T>
              <T style={{fontSize:11,color:t.muted,marginTop:2}}>Home ও সব জায়গায় এটাই দেখাবে</T>
            </View>
          </Pressable>
        </View>
        <View style={{marginBottom:16}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>{copy(lang,'selectCategory')}</T>
          <Pressable onPress={()=>setCatOpen(!catOpen)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:catOpen?t.primary:t.line,borderRadius:10,padding:12,backgroundColor:t.card}}>
            <T style={{fontSize:13,fontWeight:category?'700':'500',color:category?t.ink:t.muted}}>{category||copy(lang,'selectCategory')}</T>
            <Feather name={catOpen?'chevron-up':'chevron-down'} size={16} color={t.muted}/>
          </Pressable>
          {catOpen&&<View style={{borderWidth:1,borderColor:t.line,borderRadius:10,backgroundColor:t.card,maxHeight:160,overflow:'hidden',marginTop:4}}>
            <ScrollView nestedScrollEnabled style={{maxHeight:140}}>
              {localCats.map(c=><Pressable key={c} onPress={()=>{setCategory(c);setCatOpen(false)}} style={{paddingHorizontal:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:t.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                <T style={{fontSize:13,fontWeight:category===c?'800':'500',color:category===c?t.primary:t.ink}}>{c}</T>
                {category===c&&<Feather name="check" size={14} color={t.primary}/>}
              </Pressable>)}
            </ScrollView>
            <Pressable onPress={()=>{setShowNewCat(true);setCatOpen(false)}} style={{padding:10,backgroundColor:t.tint,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5}}>
              <Feather name="plus" size={14} color={t.primary}/>
              <T style={{fontSize:11,fontWeight:'800',color:t.primary}}>{'\u09A8\u09A4\u09C1\u09A8 \u09AC\u09BF\u09AD\u09BE\u0997'}</T>
            </Pressable>
          </View>}
          {showNewCat&&<View style={{borderRadius:10,borderWidth:1,borderColor:t.primary,padding:10,marginTop:4,backgroundColor:t.card}}>
            <TextInput value={newCatName} onChangeText={setNewCatName} placeholder={'\u09AC\u09BF\u09AD\u09BE\u0997\u09C7\u09B0 \u09A8\u09BE\u09AE...'} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:12,backgroundColor:t.bg,borderWidth:1,borderColor:t.line,borderRadius:8,padding:8,marginBottom:6,fontFamily:GF()}}/>
            <View style={{flexDirection:'row',gap:6}}>
              <Pressable onPress={()=>{setShowNewCat(false);setNewCatName('')}} style={{flex:1,alignItems:'center',paddingVertical:7,borderRadius:8,backgroundColor:t.tint}}>
                <T style={{fontSize:11,fontWeight:'700',color:t.muted}}>{copy(lang,'cancel')}</T>
              </Pressable>
              <Pressable disabled={!newCatName.trim()} onPress={addNewCat} style={{flex:1,alignItems:'center',paddingVertical:7,borderRadius:8,backgroundColor:newCatName.trim()?t.primary:t.tint,opacity:newCatName.trim()?1:0.5}}>
                <T style={{fontSize:11,fontWeight:'700',color:newCatName.trim()?'#fff':t.muted}}>{copy(lang,'create')}</T>
              </Pressable>
            </View>
          </View>}
        </View>
        <View style={{marginBottom:16}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>PDF ফাইল</T>
          {pdfFile?(
            <View style={{backgroundColor:t.card,borderWidth:1.5,borderColor:'#8B5CF6',borderRadius:12,padding:14,flexDirection:'row',alignItems:'center',gap:12}}>
              <View style={{width:44,height:44,borderRadius:10,backgroundColor:'#8B5CF6'+'18',alignItems:'center',justifyContent:'center'}}><Feather name="file-text" size={20} color="#8B5CF6"/></View>
              <View style={{flex:1}}>
                <T numberOfLines={1} style={{fontSize:12,fontWeight:'700',color:t.ink}}>{pdfFile.name}</T>
                <T style={{fontSize:10,color:t.muted,marginTop:2}}>ফাইল নির্বাচিত হয়েছে</T>
              </View>
              <Pressable onPress={()=>setPdfFile(null)} style={{padding:6}}><Feather name="x" size={16} color="#EF4444"/></Pressable>
            </View>
          ):(
            <Pressable onPress={pickPdf} style={{backgroundColor:t.card,borderWidth:1.5,borderStyle:'dashed',borderColor:'#8B5CF6',borderRadius:12,padding:20,alignItems:'center',gap:8}}>
              <View style={{width:50,height:50,borderRadius:25,backgroundColor:'#8B5CF6'+'15',alignItems:'center',justifyContent:'center'}}><Feather name="upload" size={22} color="#8B5CF6"/></View>
              <T style={{fontSize:13,fontWeight:'700',color:t.ink}}>PDF ফাইল নির্বাচন করুন</T>
              <T style={{fontSize:10,color:t.muted}}>Device থেকে PDF বাছাই করুন (সর্বোচ্চ 50MB)</T>
            </Pressable>
          )}
        </View>
        <View style={{marginBottom:16}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>লেখক নাম</T>
          <TextInput value={authorName} onChangeText={setAuthorName} placeholder={lang==='bn'?'লেখকের নাম (ঐচ্ছিক)':'Author name (optional)'} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:13,backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:12,padding:12,fontFamily:GF()}}/>
        </View>
        <View style={{marginBottom:16}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>উৎসর্গ (ঐচ্ছিক)</T>
          <TextInput value={dedication} onChangeText={setDedication} placeholder={lang==='bn'?'যাকে উৎসর্গ করতে চান...':'Who is this dedicated to...'} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:13,backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:12,padding:12,fontFamily:GF()}}/>
        </View>
      </View>}
    </ScrollView>
  </View>;
}


function LazyWebView(props:any){
  return <WebView {...props}/>;
}

function PDFReaderScreen({theme:t,lang,pdfUrl,title,onBack}:{theme:Theme;lang:Language;pdfUrl:string;title:string;onBack:()=>void}){
  const insets=useSafeAreaInsets();
  const viewerUrl=pdfUrl.startsWith('http')?`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`:pdfUrl;
  return <View style={{flex:1,backgroundColor:t.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      <Pressable onPress={onBack} style={{flexDirection:'row',alignItems:'center',gap:4}}>
        <Feather name="arrow-left" size={18} color={t.primary}/>
        <T style={{fontSize:13,fontWeight:'700',color:t.primary}}>{copy(lang,'back')}</T>
      </Pressable>
      <T numberOfLines={1} style={{fontSize:13,fontWeight:'800',color:t.ink,flex:1,textAlign:'center',marginHorizontal:10}}>{title}</T>
      <View style={{width:50}}/>
    </View>
    <LazyWebView source={{uri:viewerUrl}} style={{flex:1}} startInLoadingState={true} renderLoading={()=><View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator size="large" color={t.primary}/><T style={{marginTop:10,color:t.muted,fontSize:12}}>PDF লোড হচ্ছে...</T></View>}/>
  </View>;
}

function TermsScreen({theme:t,lang,onBack}:{theme:Theme;lang:Language;onBack:()=>void}){
  const insets=useSafeAreaInsets();
  const[tab,setTab]=useState<'terms'|'privacy'|'content'>('terms');
  const tabs={terms:copy(lang,'termsOfService'),privacy:copy(lang,'privacyPolicy'),content:copy(lang,'contentPolicy')} as const;
  const content={
    terms:{title:copy(lang,'termsOfService'),sections:[copy(lang,'termsIntro'),copy(lang,'termsAccept'),copy(lang,'termsUserContent'),copy(lang,'termsConduct'),copy(lang,'termsTermination')]},
    privacy:{title:copy(lang,'privacyPolicy'),sections:[copy(lang,'privacyIntro'),copy(lang,'privacyData'),copy(lang,'privacyUsage'),copy(lang,'privacySharing'),copy(lang,'privacySecurity'),copy(lang,'privacyChanges')]},
    content:{title:copy(lang,'contentPolicy'),sections:[copy(lang,'contentIntro'),copy(lang,'contentOwnership'),copy(lang,'contentModeration'),copy(lang,'contentReporting'),copy(lang,'contentMonetization')]}
  } as const;
  return <View style={{flex:1,backgroundColor:t.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      <Pressable onPress={onBack} hitSlop={10}><Feather name="arrow-left" size={22} color={t.ink}/></Pressable>
      <T style={{fontSize:16,fontWeight:'900',color:t.ink,marginLeft:14}}>{copy(lang,'termsOfService')}</T>
    </View>
    <View style={{flexDirection:'row',backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      {(['terms','privacy','content'] as const).map(k=><Pressable key={k} onPress={()=>setTab(k)} style={{flex:1,paddingVertical:10,alignItems:'center',borderBottomWidth:2,borderBottomColor:tab===k?t.primary:'transparent'}}><T style={{fontSize:11,fontWeight:tab===k?'800':'600',color:tab===k?t.primary:t.muted}}>{tabs[k]}</T></Pressable>)}
    </View>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}} showsVerticalScrollIndicator={false}>
      <View style={{backgroundColor:t.card,borderRadius:12,padding:16,borderWidth:1,borderColor:t.line}}>
        <T style={{fontSize:14,fontWeight:'800',color:t.ink,marginBottom:4}}>{content[tab].title}</T>
        <T style={{fontSize:10,color:t.muted,marginBottom:12}}>{copy(lang,'lastUpdated')}: 2026-08-31</T>
        {content[tab].sections.map((s,i)=><T key={i} style={{fontSize:12,color:t.ink,lineHeight:20,marginBottom:10}}>{s}</T>)}
      </View>
      <View style={{backgroundColor:t.card,borderRadius:12,padding:14,borderWidth:1,borderColor:t.line,marginTop:12}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6}}>
          <Feather name="mail" size={14} color={t.primary}/>
          <T style={{fontSize:12,fontWeight:'700',color:t.ink}}>{copy(lang,'contactUs')}</T>
        </View>
        <T style={{fontSize:11,color:t.muted}}>{copy(lang,'contactEmail')}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:4}}>{copy(lang,'contactResponse')}</T>
      </View>
    </ScrollView>
  </View>;
}

function GuideStep({step,index,isOpen,onToggle,theme:t,langKey,lang,lastStep,onStart}:{step:any;index:number;isOpen:boolean;onToggle:()=>void;theme:Theme;langKey:string;lang:string;lastStep:boolean;onStart:()=>void}){
  return <View style={{marginBottom:12}}>
    <Pressable onPress={onToggle} style={{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:isOpen?step.bg:t.card,borderRadius:14,padding:14,borderWidth:1.5,borderColor:isOpen?step.color:t.line}}>
      <View style={{width:42,height:42,borderRadius:14,backgroundColor:step.color,alignItems:'center',justifyContent:'center'}}>
        <Feather name={step.icon as any} size={20} color="#fff"/>
      </View>
      <View style={{flex:1}}>
        <T style={{fontSize:15,fontWeight:'800',color:isOpen?step.color:t.ink}}>{step.title[langKey]}</T>
        {!isOpen&&<T numberOfLines={1} style={{fontSize:12,color:t.muted,marginTop:3}}>{step.desc[langKey]}</T>}
      </View>
      <Feather name={isOpen?'chevron-up':'chevron-down'} size={18} color={isOpen?step.color:t.muted}/>
    </Pressable>
    {isOpen&&<View style={{backgroundColor:t.card,borderRadius:14,borderTopLeftRadius:0,borderTopRightRadius:0,marginTop:-2,padding:16,borderWidth:1,borderTopWidth:0,borderColor:t.line}}>
      <T style={{fontSize:13,color:t.muted,marginBottom:14,lineHeight:20}}>{step.desc[langKey]}</T>
      {step.items[langKey].map((item:string,j:number)=><View key={j} style={{flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:j<step.items[langKey].length-1?12:0}}>
        <View style={{width:24,height:24,borderRadius:12,backgroundColor:step.color,alignItems:'center',justifyContent:'center',marginTop:1}}>
          <T style={{fontSize:12,fontWeight:'800',color:'#fff'}}>{j+1}</T>
        </View>
        <T style={{fontSize:14,fontWeight:'600',color:t.ink,flex:1,lineHeight:21}}>{item}</T>
      </View>)}
      {lastStep&&<Pressable onPress={onStart} style={{marginTop:16,backgroundColor:step.color,borderRadius:12,paddingVertical:14,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8}}>
        <Feather name="edit-3" size={16} color="#fff"/>
        <T style={{fontSize:14,fontWeight:'800',color:'#fff'}}>{lang==='bn'?'এখনই শুরু করুন':lang==='hi'?'अभी शुरू करें':'Start Now'}</T>
      </Pressable>}
    </View>}
  </View>;
}

function GuideScreen({theme:t,lang,onBack,onWriter,setScreen}:{theme:Theme;lang:Language;onBack:()=>void;onWriter:()=>void;setScreen:(s:Screen)=>void}){
  const insets=useSafeAreaInsets();
  const[expandedStep,setExpandedStep]=useState<number|null>(0);
  const langKey=lang==='bn'?'bn':lang==='hi'?'hi':'en';
  const steps=[
    {icon:'user-plus',color:'#8B5CF6',bg:'#EDE9FE',title:{en:'Step 1: Create Account',bn:'ধাপ ১: অ্যাকাউন্ট তৈরি করুন',hi:'चरण 1: खाता बनाएँ'},desc:{en:'Go to Menu → Writer Studio → Register. Fill in your username, writer name, email and password. You can also sign up with Google.',bn:'মেনু → রাইটার স্টুডিও → নিবন্ধন এ যান। আপনার ইউজারনেম, লেখক নাম, ইমেইল এবং পাসওয়ার্ড দিন। গুগল দিয়েও সাইন আপ করতে পারবেন।',hi:'मेन्यू → राइटर स्टूडियो → रजिस्टर पर जाएँ। अपना यूज़रनेम, लेखक नाम, ईमेल और पासवर्ड भरें। Google से भी साइन अप कर सकते हैं।'},items:{en:['Open Menu from bottom tab','Tap "Writer Studio"','Tap "Register"','Fill username, writer name, email, password','Tap "Create Account"'],bn:['বটম ট্যাব থেকে Menu খুঁজুন','"রাইটার স্টুডিও" এ ট্যাপ করুন','"নিবন্ধন" এ ট্যাপ করুন','ইউজারনেম, লেখক নাম, ইমেইল, পাসওয়ার্ড দিন','"অ্যাকাউন্ট তৈরি করুন" এ ট্যাপ করুন'],hi:['बॉटम टैब से Menu खोजें','"राइटर स्टूडियो" पर टैप करें','"रजिस्टर" पर टैप करें','यूज़रनेम, लेखक नाम, ईमेल, पासवर्ड भरें','"खाता बनाएँ" पर टैप करें']}},
    {icon:'edit-3',color:'#3B82F6',bg:'#DBEAFE',title:{en:'Step 2: Create a Story',bn:'ধাপ ২: একটি গল্প তৈরি করুন',hi:'चरण 2: एक कहानी बनाएँ'},desc:{en:'From Writer Studio, tap "New Story". Add a title, optional description, select category and cover image.',bn:'রাইটার স্টুডিও থেকে "নতুন গল্প" এ ট্যাপ করুন। শিরোনাম, বিবরণ (ঐচ্ছিক), বিভাগ এবং কভার ছবি যোগ করুন।',hi:'राइटर स्टूडियो से "नई कहानी" पर टैप करें। शीर्षक, विवरण (वैकल्पिक), श्रेणी और कवर छवि जोड़ें।'},items:{en:['Tap "New Story" in Writer Studio','Enter a catchy title','Add a short description (optional)','Select a category','Paste a cover image URL'],bn:['রাইটার স্টুডিওতে "নতুন গল্প" এ ট্যাপ করুন','একটি আকর্ষণীয় শিরোনাম দিন','সংক্ষিপ্ত বিবরণ দিন (ঐচ্ছিক)','একটি বিভাগ নির্বাচন করুন','কভার ছবির URL দিন'],hi:['राइटर स्टूडियो में "नई कहानी" पर टैप करें','एक आकर्षक शीर्षक दर्ज करें','संक्षिप्त विवरण जोड़ें (वैकल्पिक)','एक श्रेणी चुनें','कवर छवि URL पेस्ट करें']}},
    {icon:'pen-tool',color:'#10B981',bg:'#D1FAE5',title:{en:'Step 3: Write First Chapter',bn:'ধাপ ৩: প্রথম অধ্যায় লিখুন',hi:'चरण 3: पहला अध्याय लिखें'},desc:{en:'Write your story content. Give the chapter a title and write the story body. You can edit or delete chapters later.',bn:'আপনার গল্পের লেখা লিখুন। অধ্যায়ের শিরোনাম দিন এবং গল্প লিখুন। পরে সম্পাদনা বা মুছে ফেলতে পারবেন।',hi:'अपनी कहानी का सामग्री लिखें। अध्याय को शीर्षक दें और कहानी लिखें। बाद में संपादित या हटा सकते हैं।'},items:{en:['Give the chapter a title','Write the story content','Minimum 1 chapter required','You can add more chapters later'],bn:['অধ্যায়ের শিরোনাম দিন','গল্পের লেখা লিখুন','ন্যূনতম ১ অধ্যায় প্রয়োজন','পরে আরও অধ্যায় যোগ করতে পারবেন'],hi:['अध्याय को शीर्षक दें','कहानी का सामग्री लिखें','न्यूनतम 1 अध्याय आवश्यक','बाद में और अध्याय जोड़ सकते हैं']}},
    {icon:'send',color:'#F59E0B',bg:'#FEF3C7',title:{en:'Step 4: Publish',bn:'ধাপ ৪: প্রকাশ করুন',hi:'चरण 4: प्रकाशित करें'},desc:{en:'Tap "Submit for Review". Our team will review your story. Once approved, it will appear on the home page for everyone to read.',bn:'"পর্যালোচনায় পাঠান" এ ট্যাপ করুন। আমাদের দল আপনার গল্প পর্যালোচনা করবে। অনুমোদনের পর এটি সবার জন্য হোম পেজে দেখাবে।',hi:'"समीक्षा के लिए भेजें" पर टैप करें। हमारी टीम आपकी कहानी की समीक्षा करेगी। अनुमोदन के बाद यह होम पेज पर सभी को दिखेगी।'},items:{en:['Tap "Submit for Review"','Wait for approval (usually 24 hrs)','Story appears on home page','Readers can read and comment'],bn:['"পর্যালোচনায় পাঠান" এ ট্যাপ করুন','অনুমোদনের জন্য অপেক্ষা করুন (সাধারণত ২৪ ঘণ্টা)','গল্প হোম পেজে দেখাবে','পাঠকরা পড়তে ও মন্তব্য করতে পারবেন'],hi:['"समीक्षा के लिए भेजें" पर टैप करें','अनुमोदन की प्रतीक्षा करें (आमतौर पर 24 घंटे)','कहानी होम पेज पर दिखेगी','पाठक पढ़ और टिप्पणी कर सकते हैं']}},
    {icon:'plus-circle',color:'#EC4899',bg:'#FCE7F3',title:{en:'Step 5: Add More Chapters',bn:'ধাপ ৫: আরও অধ্যায় যোগ করুন',hi:'चरण 5: और अध्याय जोड़ें'},desc:{en:'Go to Writer Studio → My Stories → select your story → Add Chapter. Keep writing and publishing new chapters to grow your audience.',bn:'রাইটার স্টুডিও → আমার গল্প → আপনার গল্প নির্বাচন → অধ্যায় যোগ করুন। নতুন অধ্যায় লিখুন ও প্রকাশ করুন।',hi:'राइटर स्टूडियो → मेरी कहानियाँ → अपनी कहानी चुनें → अध्याय जोड़ें। नए अध्याय लिखें और प्रकाशित करें।'},items:{en:['Open Writer Studio','Tap "My Stories"','Select your story','Tap "Add Chapter"','Write and publish'],bn:['রাইটার স্টুডিও খুঁজুন','"আমার গল্প" এ ট্যাপ করুন','আপনার গল্প নির্বাচন করুন','"অধ্যায় যোগ করুন" এ ট্যাপ করুন','লিখুন ও প্রকাশ করুন'],hi:['राइटर स्टूडियो खोजें','"मेरी कहानियाँ" पर टैप करें','अपनी कहानी चुनें','"अध्याय जोड़ें" पर टैप करें','लिखें और प्रकाशित करें']}},
    {icon:'trending-up',color:'#EF4444',bg:'#FEE2E2',title:{en:'Step 6: Grow & Earn',bn:'ধাপ ৬: বৃদ্ধি করুন ও আয় করুন',hi:'चरण 6: बढ़ें और कमाएँ'},desc:{en:'Share your stories, get followers, and earn money through monetization when you reach 1K followers + 5K views.',bn:'গল্প শেয়ার করুন, অনুসারী পান এবং ১,০০০ অনুসারী + ৫,০০০ পাঠক পেলে আয়করণের মাধ্যমে আয় করুন।',hi:'कहानियाँ शेयर करें, अनुयायी पाएँ और 1K अनुयायी + 5K दृश्य पर मुद्रीकरण से कमाएँ।'},items:{en:['Share stories on social media','Build your follower base','Reach 1K followers + 5K views','Start earning from ads'],bn:['সোশ্যাল মিডিয়ায় গল্প শেয়ার করুন','অনুসারী তৈরি করুন','১,০০০ অনুসারী + ৫,০০০ পাঠক পান','বিজ্ঞাপন থেকে আয় শুরু করুন'],hi:['सोशल मीडिया पर कहानियाँ शेयर करें','अनुयायी बनाएँ','1K अनुयायी + 5K दृश्य प्राप्त करें','विज्ञापन से कमाना शुरू करें']}}
  ];
  return <View style={{flex:1,backgroundColor:t.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingTop:insets.top+10,paddingBottom:12,backgroundColor:t.bg}}>
      <Pressable onPress={onBack} hitSlop={10} style={{width:36,height:36,borderRadius:12,backgroundColor:t.card,borderWidth:1,borderColor:t.line,alignItems:'center',justifyContent:'center'}}><Feather name="arrow-left" size={18} color={t.ink}/></Pressable>
      <View style={{flex:1,marginLeft:12}}>
        <T style={{fontSize:18,fontWeight:'900',color:t.ink}}>{copy(lang,'guideTitle')}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:1}}>{copy(lang,'guideSub')}</T>
      </View>
      <View style={{width:36,height:36,borderRadius:12,backgroundColor:'#FEF3C7',alignItems:'center',justifyContent:'center'}}><Feather name="book-open" size={16} color="#D97706"/></View>
    </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:insets.bottom+40}}>
      <View style={{backgroundColor:t.card,borderRadius:16,padding:18,marginBottom:16,borderWidth:1,borderColor:t.line}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
          <View style={{width:44,height:44,borderRadius:22,backgroundColor:'#FEF3C7',alignItems:'center',justifyContent:'center'}}><Feather name="zap" size={20} color="#D97706"/></View>
          <View style={{flex:1}}>
            <T style={{fontSize:16,fontWeight:'900',color:t.ink}}>{lang==='bn'?'লেখক হিসেবে শুরু করুন':lang==='hi'?'लेखक के रूप में शुरू करें':'Start as a Writer'}</T>
            <T style={{fontSize:13,color:t.muted,marginTop:3}}>{lang==='bn'?'৬ টি সহজ ধাপে গল্প লিখুন ও প্রকাশ করুন':lang==='hi'?'६ आसान चरणों में कहानी लिखें और प्रकाशित करें':'Write and publish in 6 easy steps'}</T>
          </View>
        </View>
      </View>
      {steps.map((step,i)=><GuideStep key={i} step={step} index={i} isOpen={expandedStep===i} onToggle={()=>setExpandedStep(expandedStep===i?null:i)} theme={t} langKey={langKey} lang={lang} lastStep={i===steps.length-1} onStart={()=>setScreen({type:'writer'})}/>)}
      <View style={{backgroundColor:t.card,borderRadius:16,padding:18,borderWidth:1,borderColor:t.line}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:14}}>
          <Feather name="help-circle" size={20} color={t.primary}/>
          <T style={{fontSize:15,fontWeight:'800',color:t.ink}}>{lang==='bn'?'গুরুত্বপূর্ণ তথ্য':lang==='hi'?'महत्वपूर्ण जानकारी':'Important Info'}</T>
        </View>
        {[{icon:'check-circle',color:'#10B981',text:{en:'At least 1 chapter required to publish',bn:'প্রকাশ করতে ন্যূনতম ১ অধ্যায় লাগবে',hi:'प्रकाशित करने के लिए कम से कम 1 अध्याय चाहिए'}},
          {icon:'clock',color:'#F59E0B',text:{en:'Story review usually takes 24 hours',bn:'গল্প পর্যালোচনা সাধারণত ২৪ ঘণ্টা লাগে',hi:'कहानी की समीक्षा में आमतौर पर 24 घंटे लगते हैं'}},
          {icon:'edit',color:'#3B82F6',text:{en:'You can edit or delete stories anytime',bn:'যেকোনো সময় গল্প এডিট বা ডিলিট করতে পারবেন',hi:'कभी भी कहानी एडिट या डिलीट कर सकते हैं'}},
          {icon:'dollar-sign',color:'#EF4444',text:{en:'Earn money at 1K followers + 5K views',bn:'১,০০০ ফলোয়ার্স + ৫,০০০ ভিউতে আয় শুরু',hi:'1K फॉलोअर्स + 5K व्यूज पर कमाना शुरू'}}
        ].map((item,j)=><View key={j} style={{flexDirection:'row',alignItems:'center',gap:12,marginBottom:j<3?12:0,backgroundColor:item.color+'08',borderRadius:10,padding:10}}>
          <Feather name={item.icon as any} size={18} color={item.color}/>
          <T style={{fontSize:13,fontWeight:'600',color:t.ink,flex:1}}>{item.text[langKey]}</T>
        </View>)}
      </View>
    </ScrollView>
  </View>;
}

function AboutAppScreen({theme:t,lang,onBack}:{theme:Theme;lang:Language;onBack:()=>void}){
  const insets=useSafeAreaInsets();
  const[apiData,setApiData]=useState<{title:string;subtitle:string;description:string;features:string[];version:string;developer:string}|null>(null);
  useEffect(()=>{fetchAbout().then(d=>{if(d&&d.title)setApiData(d)}).catch(()=>{})},[]);
  const defaults:Record<string,{title:string;subtitle:string;desc:string;features:{icon:any;color:string;text:string}[]}>={
    bn:{title:'Lekhoni Kahini',subtitle:'বাংলা সাহিত্য ও উপন্যাসের এক অনন্য পাঠভুবন',desc:'এখানে পাবেন নতুন ও জনপ্রিয় লেখকদের অসংখ্য উপন্যাস, ছোটগল্প, কবিতা ও বিভিন্ন সাহিত্যকর্ম। নিজের পছন্দের গল্প খুঁজে পড়ুন, প্রিয় লেখকদের অনুসরণ করুন এবং বাংলা সাহিত্যের গল্পে হারিয়ে যান।',features:[{icon:'book-open',color:'#10B981',text:'হাজার হাজার বাংলা গল্প ও উপন্যাস'},{icon:'users',color:'#3B82F6',text:'নতুন ও জনপ্রিয় লেখকদের সৃজনশীল সাহিত্য'},{icon:'wifi-off',color:'#8B5CF6',text:'অফলাইনে পড়ার সুবিধা'},{icon:'feather',color:'#F59E0B',text:'নিজের গল্প লেখা ও প্রকাশের সুযোগ'},{icon:'dollar-sign',color:'#EF4444',text:'গল্প লিখে আয়ের সুযোগ পান'},{icon:'shield',color:'#06B6D4',text:'নিরাপদ ও ব্যবহারকারী-বান্ধব অভিজ্ঞতা'}]},
    en:{title:'Lekhoni Kahini',subtitle:'Your gateway to Bengali literature & novels',desc:'Discover thousands of novels, short stories, poems and literary works from popular Bengali authors. Find your favorite stories, follow beloved writers and immerse yourself in Bengali literature.',features:[{icon:'book-open',color:'#10B981',text:'Thousands of Bengali stories & novels'},{icon:'users',color:'#3B82F6',text:'Creative works from popular authors'},{icon:'wifi-off',color:'#8B5CF6',text:'Read offline anytime'},{icon:'feather',color:'#F59E0B',text:'Write & publish your own stories'},{icon:'dollar-sign',color:'#EF4444',text:'Earn money by writing stories'},{icon:'shield',color:'#06B6D4',text:'Safe & user-friendly experience'}]},
    hi:{title:'Lekhoni Kahini',subtitle:'बंगाली साहित्य और उपन्यासों का अनोखा मंच',desc:'यहाँ पाएं नए और लोकप्रिय लेखकों की असंख्य कहानियाँ, लघु कथाएँ, कविताएँ और साहित्यिक कृतियाँ। अपनी पसंदीदा कहानियाँ खोजें, प्रिय लेखकों का अनुसरण करें और बंगाली साहित्य में खो जाएं।',features:[{icon:'book-open',color:'#10B981',text:'हज़ारों बंगाली कहानियाँ और उपन्यास'},{icon:'users',color:'#3B82F6',text:'लोकप्रिय लेखकों की रचनाएँ'},{icon:'wifi-off',color:'#8B5CF6',text:'कभी भी ऑफ़लाइन पढ़ें'},{icon:'feather',color:'#F59E0B',text:'अपनी कहानियाँ लिखें और प्रकाशित करें'},{icon:'dollar-sign',color:'#EF4444',text:'कहानी लिखकर कमाएं'},{icon:'shield',color:'#06B6D4',text:'सुरक्षित और उपयोगकर्ता-अनुकूल'}]}
  };
  const d=defaults[lang]||defaults.bn;
  const finalTitle=apiData?.title||d.title;
  const finalSubtitle=apiData?.subtitle||d.subtitle;
  const finalDesc=apiData?.description||d.desc;
  const finalFeatures=(apiData?.features&&apiData.features.length>0?apiData.features:d.features.map(f=>f.text));
  return <View style={{flex:1,backgroundColor:t.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      <Pressable onPress={onBack} hitSlop={10}><Feather name="arrow-left" size={22} color={t.ink}/></Pressable>
      <T style={{fontSize:16,fontWeight:'900',color:t.ink,marginLeft:14}}>{copy(lang,'aboutApp')}</T>
    </View>
    <ScrollView contentContainerStyle={{paddingBottom:40}} showsVerticalScrollIndicator={false}>
      <View style={{backgroundColor:t.primary,paddingTop:28,paddingBottom:32,alignItems:'center',position:'relative',overflow:'hidden'}}>
        <Svg width={140} height={140} style={{position:'absolute',top:-30,right:-40,opacity:0.07}}>
          <Circle cx={70} cy={70} r={60} fill="#fff"/>
          {[0,45,90,135,180,225,270,315].map((r,i)=><Ellipse key={i} cx={70} cy={70} rx={14} ry={42} fill="#fff" transform={`rotate(${r} 70 70)`}/>)}
        </Svg>
        <Svg width={100} height={100} style={{position:'absolute',bottom:-20,left:-25,opacity:0.05}}>
          {[0,60,120,180,240,300].map((r,i)=><Ellipse key={i} cx={50} cy={50} rx={10} ry={35} fill="#fff" transform={`rotate(${r} 50 50)`}/>)}
        </Svg>
        <View style={{width:56,height:56,borderRadius:14,backgroundColor:'rgba(255,255,255,0.15)',alignItems:'center',justifyContent:'center',marginBottom:10,borderWidth:1.5,borderColor:'rgba(255,255,255,0.2)'}}>
          <Feather name="book-open" size={26} color="#fff"/>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:'#fff',marginBottom:4}}>{finalTitle}</T>
        <T style={{fontSize:11,color:'rgba(255,255,255,0.8)',textAlign:'center',maxWidth:260,lineHeight:16}}>{finalSubtitle}</T>
      </View>
      <View style={{paddingHorizontal:16,marginTop:-14}}>
        <View style={{backgroundColor:t.card,borderRadius:12,padding:14,borderWidth:1,borderColor:t.line}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:8}}>
            <View style={{width:22,height:22,borderRadius:6,backgroundColor:t.primary+'18',alignItems:'center',justifyContent:'center'}}>
              <Feather name="file-text" size={11} color={t.primary}/>
            </View>
            <T style={{fontSize:12,fontWeight:'800',color:t.ink}}>{copy(lang,'aboutApp')}</T>
          </View>
          <T style={{fontSize:11,color:t.muted,lineHeight:18}}>{finalDesc}</T>
        </View>
      </View>
      <View style={{paddingHorizontal:16,marginTop:12}}>
        <T style={{fontSize:12,fontWeight:'800',color:t.ink,marginBottom:8,marginLeft:2}}>{lang==='bn'?'বৈশিষ্ট্য':lang==='hi'?'विशेषताएँ':'Features'}</T>
        {finalFeatures.map((f,i)=>{
          const colors=['#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#06B6D4'];
          const icons=['book-open','users','wifi-off','feather','dollar-sign','shield'];
          const c=colors[i%colors.length];
          return <View key={i} style={{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:t.card,borderRadius:10,padding:10,marginBottom:6,borderWidth:1,borderColor:t.line}}>
            <View style={{width:28,height:28,borderRadius:8,backgroundColor:c+'18',alignItems:'center',justifyContent:'center'}}>
              <Feather name={icons[i%icons.length]as any} size={13} color={c}/>
            </View>
            <T style={{fontSize:11,fontWeight:'600',color:t.ink,flex:1}}>{f}</T>
          </View>
        })}
      </View>
      <View style={{paddingHorizontal:16,marginTop:12}}>
        <View style={{backgroundColor:'#FEF3C7',borderRadius:12,padding:12,borderWidth:1,borderColor:'#F59E0B'}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6}}>
            <Feather name="zap" size={14} color="#D97706"/>
            <T style={{fontSize:11,fontWeight:'800',color:'#92400E'}}>{lang==='bn'?'আয়ের সুযোগ':lang==='hi'?'कमाई का अवसर':'Earning Opportunity'}</T>
          </View>
          <T style={{fontSize:10,color:'#78350F',lineHeight:16}}>{lang==='bn'?'আপনি আপনার গল্প লিখে এবং এই অ্যাপে প্রকাশ করে আয় করতে পারবেন। আপনার গল্প যত বেশি পড়া হবে, তত বেশি আয় হবে।':lang==='hi'?'आप अपनी कहानी लिखकर और इस ऐप पर प्रकाशित करके कमा सकते हैं। जितनी ज़्यादा आपकी कहानी पढ़ी जाएगी, उतनी ज़्यादा कमाई होगी।':'Write stories and publish on this app to earn. The more your stories are read, the more you earn.'}</T>
        </View>
      </View>
      <View style={{paddingHorizontal:16,marginTop:16,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:4,marginBottom:4}}>
          <Feather name="heart" size={11} color="#EF4444"/>
          <T style={{fontSize:10,color:t.muted}}>{apiData?.developer||'Kawsar Hosen'}</T>
        </View>
         <T style={{fontSize:9,color:t.muted}}>Version {apiData?.version||'1.1.0'}</T>
      </View>
    </ScrollView>
  </View>;
}

function EditStoryScreen({token,theme:t,lang,storyId,initialTitle,initialDesc,initialCover,initialWriterStatus,onBack,onSaved}:{token:string;theme:Theme;lang:Language;storyId:string;initialTitle:string;initialDesc:string;initialCover:string|null;initialWriterStatus:string;onBack:()=>void;onSaved:()=>void}){
  const insets=useSafeAreaInsets();
  const[title,setTitle]=useState(initialTitle);
  const[desc,setDesc]=useState(initialDesc);
  const[cover,setCover]=useState(initialCover||'');
  const[coverPreview,setCoverPreview]=useState(initialCover||'');
  const[writerStatus,setWriterStatus]=useState(initialWriterStatus);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[uploadingImg,setUploadingImg]=useState(false);
  const pickCover=async()=>{setUploadingImg(true);try{const url=await pickAndResizeImage('cover');if(url){setCover(url);setCoverPreview(url)}}catch{}setUploadingImg(false)};
  const save=async()=>{if(!title.trim())return;setSaving(true);try{await updateWriterStory(token,storyId,{title:title.trim(),description:desc.trim(),cover_url:cover||undefined,writer_status:writerStatus||undefined});onSaved();setSaved(true);setTimeout(()=>onBack(),1200)}catch(e){}finally{setSaving(false)}};
  return <View style={{flex:1,backgroundColor:t.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      <Pressable onPress={onBack} style={{flexDirection:'row',alignItems:'center',gap:4}}>
        <Feather name="arrow-left" size={18} color={t.primary}/>
        <T style={{fontSize:13,fontWeight:'700',color:t.primary}}>{copy(lang,'cancel')}</T>
      </Pressable>
      <T style={{fontSize:15,fontWeight:'900',color:t.ink}}>সম্পাদনা</T>
      <Pressable onPress={save} disabled={saving||!title.trim()} style={{backgroundColor:t.primary,borderRadius:8,paddingHorizontal:12,paddingVertical:6,opacity:saving||!title.trim()?0.5:1}}>
        {saving?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:12}}>{copy(lang,'save')}</T>}
      </Pressable>
    </View>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}} keyboardShouldPersistTaps="handled">
      {saved&&<View style={{backgroundColor:'#10B981'+'18',borderRadius:10,padding:12,marginBottom:14,flexDirection:'row',alignItems:'center',gap:8}}>
        <Feather name="check-circle" size={18} color="#10B981"/>
        <T style={{fontSize:13,fontWeight:'700',color:'#10B981'}}>সংরক্ষিত হয়েছে</T>
      </View>}
      <View style={{backgroundColor:t.primary+'12',borderRadius:10,padding:12,marginBottom:16,flexDirection:'row',alignItems:'flex-start',gap:8}}>
        <Feather name="info" size={16} color={t.primary} style={{marginTop:2}}/>
        <T style={{fontSize:12,color:t.ink,lineHeight:20,flex:1}}>আপনি যেকোনো সময় এই গল্পটি পুনরায় সম্পাদনা করতে পারবেন। পরিবর্তন করার পর "সংরক্ষণ" চাপুন।</T>
      </View>
      <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>কভার ছবি</T>
      <Pressable onPress={pickCover} disabled={uploadingImg} style={{borderRadius:12,borderWidth:1.5,borderColor:t.line,borderStyle:'dashed',overflow:'hidden',marginBottom:16}}>
        {uploadingImg?<View style={{height:140,alignItems:'center',justifyContent:'center',backgroundColor:t.card}}><ActivityIndicator size="small" color={t.primary}/></View>:
        coverPreview?<View style={{height:140,backgroundColor:t.card,alignItems:'center',justifyContent:'center'}}><Image source={{uri:coverPreview}} style={{width:100,height:130,borderRadius:10}} resizeMode="cover"/><View style={{flexDirection:'row',alignItems:'center',gap:5,marginTop:8}}><Feather name="refresh-cw" size={12} color={t.muted}/><T style={{fontSize:11,color:t.muted,fontWeight:'600'}}>{copy(lang,'changePhoto')}</T></View></View>:
        <View style={{height:140,backgroundColor:t.card,alignItems:'center',justifyContent:'center'}}><Feather name="camera" size={28} color={t.muted}/><T style={{fontSize:12,color:t.muted,marginTop:6,fontWeight:'600'}}>{copy(lang,'addCover')}</T></View>}
      </Pressable>
      <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:4}}>শিরোনাম</T>
      <TextInput value={title} onChangeText={setTitle} placeholder="গল্পের শিরোনাম" placeholderTextColor={t.muted} style={{color:t.ink,fontSize:16,fontWeight:'700',backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:10,padding:12,marginBottom:16,fontFamily:GF()}}/>
      <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:4}}>বিবরণ</T>
      <TextInput value={desc} onChangeText={setDesc} multiline placeholder="বিবরণ লিখুন..." placeholderTextColor={t.muted} style={{color:t.ink,fontSize:13,backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:10,padding:12,minHeight:120,textAlignVertical:'top',fontFamily:GF(),lineHeight:20,marginBottom:16}}/>
      <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>গল্পের ধরন</T>
      <View style={{flexDirection:'row',gap:8,marginBottom:20}}>
        {([['ongoing','ধারাবাহিক','ongoing'],['complete','সম্পূর','complete']] as const).map(([k,l,v])=>(
          <Pressable key={k} onPress={()=>setWriterStatus(writerStatus===v?'':v)} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:writerStatus===v?t.primary:t.card,borderWidth:1.5,borderColor:writerStatus===v?t.primary:t.line,borderRadius:10,paddingVertical:12}}>
            <View style={{width:18,height:18,borderRadius:9,borderWidth:2,borderColor:writerStatus===v?'#fff':t.muted,alignItems:'center',justifyContent:'center'}}>
              {writerStatus===v&&<View style={{width:10,height:10,borderRadius:5,backgroundColor:'#fff'}}/>}
            </View>
            <T style={{fontSize:14,fontWeight:'800',color:writerStatus===v?'#fff':t.ink}}>{l}</T>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  </View>;
}

function WriterStories({token,theme:t,lang,categories,setScreen,onRefresh}:{token:string;theme:Theme;lang:Language;categories:string[];setScreen:(s:Screen)=>void;onRefresh?:()=>void}){
  const insets=useSafeAreaInsets();
  const[stories,setStories]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState<'all'|'published'|'draft'|'pending'|'rejected'>('all');
  const[expanded,setExpanded]=useState<string|null>(null);
  const[chapters,setChapters]=useState<any[]>([]);
  const[chTitle,setChTitle]=useState('');
  const[chBody,setChBody]=useState('');
  const[chSaving,setChSaving]=useState(false);
  const[storyStatuses,setStoryStatuses]=useState<Record<string,string>>({});
  const[writerStatuses,setWriterStatuses]=useState<Record<string,string>>({});
  const[deleteId,setDeleteId]=useState<string|null>(null);
  const load=()=>{fetchWriterStories(token).then(s=>{setStories(s||[]);const m:Record<string,string>={};const w:Record<string,string>={};(s||[]).forEach((x:any)=>{if(x.display_status)m[x.id]=x.display_status;if(x.writer_status)w[x.id]=x.writer_status});setStoryStatuses(m);setWriterStatuses(w)}).finally(()=>setLoading(false))};
  useEffect(()=>{load()},[token]);
  const filtered=filter==='all'?stories:stories.filter(s=>s.status===filter);
  const statusColor=(s:string)=>s==='published'?'#10B981':s==='pending'?'#F59E0B':s==='rejected'?'#EF4444':'#9CA3AF';
  const toggleExpand=async(id:string)=>{
    if(expanded===id){setExpanded(null);return}
    setExpanded(id);setChapters([]);
    try{const detail=await fetchWriterStoryDetail(token,id);if(detail?.chapters)setChapters(detail.chapters)}catch{}
  };
  const addChapter=async(storyId:string)=>{
    if(!chTitle.trim())return;setChSaving(true);
    const r=await createStoryChapter(token,storyId,chTitle.trim(),chBody);
    if(r){setChapters(c=>[...c,r]);setChTitle('');setChBody('')}
    setChSaving(false);
  };
  const removeChapter=async(storyId:string,chapterId:string)=>{
    await deleteStoryChapter(token,storyId,chapterId);
    setChapters(c=>c.filter(x=>x.id!==chapterId));
  };
  const handleSubmit=async(id:string)=>{await submitStoryForReview(token,id);load()};
  const handleDelete=async(id:string)=>{setDeleteId(id)};
  const confirmDelete=async()=>{if(deleteId){await deleteWriterStory(token,deleteId);setDeleteId(null);load();onRefresh?.()}};
  const toggleDisplayStatus=async(id:string,status:string)=>{const newStatus=storyStatuses[id]===status?'':status;setStoryStatuses(s=>({...s,[id]:newStatus}));await updateWriterStory(token,id,{display_status:newStatus});setStories(s=>s.map(x=>x.id===id?{...x,display_status:newStatus}:x))};
  const toggleWriterStatus=async(id:string,status:string)=>{const newStatus=writerStatuses[id]===status?'':status;setWriterStatuses(s=>({...s,[id]:newStatus}));await updateWriterStory(token,id,{writer_status:newStatus});setStories(s=>s.map(x=>x.id===id?{...x,writer_status:newStatus}:x))};
  const startEdit=(s:any)=>{setScreen({type:'editStory',id:s.id,title:s.title,desc:s.description||'',coverUrl:s.cover_url||null,writerStatus:s.writer_status||''})};
  return <View style={{flex:1}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
      <T style={{fontSize:16,fontWeight:'900',color:t.ink}}>{copy(lang,'myStories')} ({stories.length})</T>
      <Pressable onPress={()=>setScreen({type:'newStory'})} style={{backgroundColor:t.primary,borderRadius:10,paddingHorizontal:12,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:5}}>
        <Feather name="plus" size={14} color="#fff"/>
        <T style={{color:'#fff',fontWeight:'800',fontSize:12}}>{copy(lang,'newStory')}</T>
      </Pressable>
    </View>
    <View style={{flexDirection:'row',gap:5,marginBottom:14}}>
      {(['all','published','draft','pending','rejected'] as const).map(f=><Pressable key={f} onPress={()=>setFilter(f)} style={{paddingHorizontal:10,paddingVertical:5,borderRadius:8,backgroundColor:filter===f?t.primary:t.card,borderWidth:1,borderColor:filter===f?t.primary:t.line}}>
        <T style={{fontSize:11,fontWeight:'700',color:filter===f?'#fff':t.muted}}>{copy(lang,f)}</T>
      </Pressable>)}
    </View>
    {loading?<View style={{alignItems:'center',paddingVertical:40}}><ActivityIndicator color={t.primary}/></View>:
    filtered.length===0?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="book" size={28} color={t.muted}/><T style={{fontSize:13,color:t.muted,marginTop:8}}>{copy(lang,'noStories')}</T></View>:
    filtered.map(s=><View key={s.id} style={{backgroundColor:t.card,borderRadius:14,padding:14,marginBottom:8,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
        {s.cover_url?<Image source={{uri:s.cover_url}} style={{width:44,height:34,borderRadius:6,marginRight:10}}/>:
        <View style={{width:44,height:34,borderRadius:6,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:10}}><Feather name="book-open" size={14} color={t.muted}/></View>}
        <View style={{width:8,height:8,borderRadius:4,backgroundColor:statusColor(s.status),marginRight:8}}/>
        <T numberOfLines={1} style={{flex:1,fontSize:14,fontWeight:'800',color:t.ink}}>{s.title}</T>
        {(s as any).pdf_url?<View style={{paddingHorizontal:6,paddingVertical:2,borderRadius:4,backgroundColor:'#8B5CF6'+'18',marginRight:6}}><T style={{fontSize:9,fontWeight:'800',color:'#8B5CF6'}}>PDF</T></View>:null}
        <View style={{paddingHorizontal:8,paddingVertical:3,borderRadius:6,backgroundColor:statusColor(s.status)+'18'}}>
          <T style={{fontSize:10,fontWeight:'700',color:statusColor(s.status)}}>{copy(lang,s.status)}</T>
        </View>
      </View>
      {s.description?<T numberOfLines={2} style={{fontSize:12,color:t.muted,marginBottom:8}}>{s.description}</T>:null}
      <View style={{flexDirection:'row',gap:6}}>
        {s.status==='draft'&&<Pressable onPress={()=>handleSubmit(s.id)} style={{flex:1,backgroundColor:'#FEF3C7',borderRadius:8,paddingVertical:7,alignItems:'center'}}>
          <T style={{fontSize:11,fontWeight:'700',color:'#D97706'}}>{copy(lang,'submitReview')}</T>
        </Pressable>}
        {s.status==='rejected'&&<Pressable onPress={()=>handleSubmit(s.id)} style={{flex:1,backgroundColor:'#FEE2E2',borderRadius:8,paddingVertical:7,alignItems:'center'}}>
          <T style={{fontSize:11,fontWeight:'700',color:'#EF4444'}}>{copy(lang,'submitReview')}</T>
        </Pressable>}
        <Pressable onPress={()=>toggleExpand(s.id)} style={{width:32,height:32,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
          <Feather name="book-open" size={14} color={expanded===s.id?t.primary:t.muted}/>
        </Pressable>
        <Pressable onPress={()=>startEdit(s)} style={{width:32,height:32,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
          <Feather name="edit-2" size={14} color={t.muted}/>
        </Pressable>
        <Pressable onPress={()=>toggleDisplayStatus(s.id,'ongoing')} style={{width:32,height:32,borderRadius:8,backgroundColor:(storyStatuses[s.id]||s.display_status)==='ongoing'?'#10B981':t.tint,alignItems:'center',justifyContent:'center'}}>
          <T style={{fontSize:9,fontWeight:'800',color:(storyStatuses[s.id]||s.display_status)==='ongoing'?'#fff':t.muted}}>চলমান</T>
        </Pressable>
        <Pressable onPress={()=>toggleDisplayStatus(s.id,'new')} style={{width:32,height:32,borderRadius:8,backgroundColor:(storyStatuses[s.id]||s.display_status)==='new'?'#8B5CF6':t.tint,alignItems:'center',justifyContent:'center'}}>
          <T style={{fontSize:9,fontWeight:'800',color:(storyStatuses[s.id]||s.display_status)==='new'?'#fff':t.muted}}>নতুন</T>
        </Pressable>
        <Pressable onPress={()=>handleDelete(s.id)} style={{width:32,height:32,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
          <Feather name="trash-2" size={14} color={t.muted}/>
        </Pressable>
      </View>
      {s.review_note&&<View style={{marginTop:8,backgroundColor:'#FEF2F2',borderRadius:8,padding:8}}>
        <T style={{fontSize:11,color:'#991B1B',fontWeight:'600'}}>{copy(lang,'reviewNote')}: {s.review_note}</T>
      </View>}
      {expanded===s.id&&<View style={{marginTop:10,borderTopWidth:1,borderTopColor:t.line,paddingTop:10}}>
        <T style={{fontSize:12,fontWeight:'800',color:t.ink,marginBottom:6}}>{copy(lang,'chapters')} ({chapters.length})</T>
        {chapters.map((ch,i)=><View key={ch.id} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:8,padding:8,marginBottom:4}}>
          <View style={{width:22,height:22,borderRadius:11,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:8}}>
            <T style={{fontSize:10,fontWeight:'800',color:t.primary}}>{i+1}</T>
          </View>
          <T numberOfLines={1} style={{flex:1,fontSize:12,fontWeight:'600',color:t.ink}}>{ch.title}</T>
          <Pressable onPress={()=>removeChapter(s.id,ch.id)}><Feather name="x" size={15} color={t.muted}/></Pressable>
        </View>)}
        <TextInput value={chTitle} onChangeText={setChTitle} placeholder={copy(lang,'chapterTitle')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:13,fontWeight:'700',marginTop:8,borderBottomWidth:1,borderBottomColor:t.line,paddingBottom:6,fontFamily:GF()}}/>
        <TextInput value={chBody} onChangeText={setChBody} multiline placeholder={copy(lang,'chapterBody')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:12,marginTop:8,minHeight:60,textAlignVertical:'top',fontFamily:GF()}}/>
        <Pressable disabled={chSaving||!chTitle.trim()} onPress={()=>addChapter(s.id)} style={{backgroundColor:t.primary,borderRadius:8,paddingVertical:8,alignItems:'center',marginTop:8,opacity:chSaving||!chTitle.trim()?0.5:1}}>
          {chSaving?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:12}}>{copy(lang,'addChapter')}</T>}
        </Pressable>
      </View>}
    </View>)}
  {deleteId&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24,zIndex:999}}>
    <View style={{width:'100%',backgroundColor:t.card,borderRadius:22,padding:24,alignItems:'center',borderWidth:1,borderColor:t.line}}>
      <View style={{width:56,height:56,borderRadius:28,backgroundColor:'#FEE2E2',alignItems:'center',justifyContent:'center',marginBottom:16}}>
        <Feather name="alert-triangle" size={28} color="#EF4444"/>
      </View>
      <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center',marginBottom:8}}>গল্প মুছে ফেলবেন?</T>
      <T style={{fontSize:13,color:t.muted,textAlign:'center',lineHeight:20,marginBottom:20}}>
        {'আপনার গল্পটি মুছে ফেললে আর কেউ এটি পড়তে পারবে না। এই গল্পের সব পর্ব, পছন্দ, ভিউ এবং মন্তব্য সব চিরতরে মুছে যাবে।\n\nএই কাজটি আর ফেরানো যাবে না।'}
      </T>
      <View style={{flexDirection:'row',gap:10,width:'100%'}}>
        <Pressable onPress={()=>setDeleteId(null)} style={{flex:1,height:48,borderRadius:14,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
          <T style={{color:t.primary,fontWeight:'800',fontSize:14}}>ফিরে যান</T>
        </Pressable>
        <Pressable onPress={confirmDelete} style={{flex:1,height:48,borderRadius:14,backgroundColor:'#EF4444',alignItems:'center',justifyContent:'center'}}>
          <T style={{color:'#fff',fontWeight:'800',fontSize:14}}>মুছে ফেলুন</T>
        </Pressable>
      </View>
    </View>
  </View>}
  </View>}

function WriterProfileStudio({token,theme:t,writer,lang,onUpdate,onDeleteAccount}:{token:string;theme:Theme;writer:any;lang:Language;onUpdate:(patch:any)=>void;onDeleteAccount:()=>void}){
  const[editing,setEditing]=useState(false);
  const[name,setName]=useState(writer?.writer_name||'');
  const[username,setUsername]=useState(writer?.username||'');
  const[bio,setBio]=useState(writer?.bio||'');
  const[avatar,setAvatar]=useState(writer?.avatar_url||'');
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[uploadingImg,setUploadingImg]=useState(false);
  const[err,setErr]=useState('');
  const handlePickAvatar=async()=>{
    setUploadingImg(true);setErr('');
    try{const url=await pickAndResizeImage('avatar');
    if(url){setAvatar(url);await updateWriterProfile(token,{avatar_url:url});onUpdate({avatar_url:url})}}catch{}
    setUploadingImg(false);
  };
  const handleSave=async()=>{
    setSaving(true);setErr('');
    const r=await updateWriterProfile(token,{writer_name:name.trim(),bio:bio.trim(),avatar_url:avatar||undefined,username:username.trim()||undefined});
    setSaving(false);
    if(r.ok){setSaved(true);onUpdate({writer_name:name.trim(),bio:bio.trim(),avatar_url:avatar||undefined,username:username.trim()||undefined});setTimeout(()=>{setSaved(false);setEditing(false)},1500)}
    else setErr(r.error==='Username already taken'?copy(lang,'usernameTaken'):r.error||'');
  };
  return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={Platform.OS==='ios'?90:0}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:40}} keyboardShouldPersistTaps="handled">
    <View style={{alignItems:'center',marginBottom:20}}>
      <Pressable onPress={editing?handlePickAvatar:()=>setEditing(true)} disabled={uploadingImg} style={{marginBottom:10}}>
        {uploadingImg?<View style={{width:90,height:90,borderRadius:45,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}><ActivityIndicator size="small" color={t.primary}/></View>:
        (avatar||writer?.avatar_url)?<View><Image source={{uri:avatar||writer?.avatar_url}} style={{width:90,height:90,borderRadius:45}}/>{editing&&<View style={{position:'absolute',bottom:0,right:0,backgroundColor:t.primary,borderRadius:14,width:28,height:28,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:t.card}}><Feather name="camera" size={13} color="#fff"/></View>}</View>:
        <View style={{width:90,height:90,borderRadius:45,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',elevation:4,shadowColor:t.primary,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:8}}>
          <T style={{fontSize:32,fontWeight:'900',color:'#fff'}}>{writer?.writer_name?.[0]?.toUpperCase()||'?'}</T>
          {editing&&<View style={{position:'absolute',bottom:0,backgroundColor:'rgba(0,0,0,0.4)',borderRadius:14,width:28,height:28,alignItems:'center',justifyContent:'center'}}><Feather name="camera" size={13} color="#fff"/></View>}
        </View>}
      </Pressable>
      {!editing&&<><View style={{flexDirection:'row',alignItems:'center',gap:6}}>
        <T style={{fontSize:20,fontWeight:'900',color:t.ink}}>{writer?.writer_name}</T>
        <BadgeIcon badge={writer?.badge} size={20}/>
      </View>
      <T style={{fontSize:13,color:t.muted,marginTop:3}}>@{writer?.username}</T>
      {writer?.bio&&<T style={{fontSize:13,color:t.muted,marginTop:8,textAlign:'center',lineHeight:20,maxWidth:300}}>{writer?.bio}</T>}
      </>}
    </View>
    {!editing?
    <Pressable onPress={()=>setEditing(true)} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:t.primary,borderRadius:14,paddingVertical:13,marginBottom:14,gap:8}}>
      <Feather name="edit-2" size={16} color="#fff"/>
      <T style={{fontSize:14,fontWeight:'800',color:'#fff'}}>{copy(lang,'editProfile')}</T>
    </Pressable>:
    <View style={{backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>{copy(lang,'editProfile')}</T>
        <Pressable onPress={()=>{setEditing(false);setErr('')}}><T style={{fontSize:13,fontWeight:'700',color:t.muted}}>{copy(lang,'cancel')}</T></Pressable>
      </View>
      <View style={{marginBottom:12}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'username')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,paddingHorizontal:12,height:44}}>
          <Feather name="at-sign" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:14,fontWeight:'600',fontFamily:GF()}}/>
        </View>
      </View>
      <View style={{marginBottom:12}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'writerName')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,paddingHorizontal:12,height:44}}>
          <Feather name="user" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={name} onChangeText={setName} style={{flex:1,color:t.ink,fontSize:14,fontWeight:'600',fontFamily:GF()}}/>
        </View>
      </View>
      <View style={{marginBottom:16}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'bio')}</T>
        <View style={{backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,padding:12,minHeight:80}}>
          <TextInput value={bio} onChangeText={setBio} multiline placeholder={copy(lang,'bioPlaceholder')} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:14,fontWeight:'500',lineHeight:20,fontFamily:GF()}}/>
        </View>
      </View>
      {err?<View style={{backgroundColor:'#FEF2F2',borderRadius:10,padding:10,marginBottom:12,flexDirection:'row',alignItems:'center',gap:6}}><Feather name="alert-circle" size={14} color="#EF4444"/><T style={{fontSize:12,fontWeight:'600',color:'#EF4444',flex:1}}>{err}</T></View>:null}
      <Pressable disabled={saving} onPress={handleSave} style={{backgroundColor:saved?'#10B981':t.primary,borderRadius:12,paddingVertical:12,alignItems:'center'}}>
        {saving?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:14}}>{saved?'✓ '+copy(lang,'saved'):copy(lang,'save')}</T>}
      </Pressable></View>}
      {/* Delete Account */}
      {!editing&&<View style={{marginTop:20,paddingTop:20,borderTopWidth:1,borderTopColor:t.line}}>
        <T style={{fontSize:11,color:t.muted,textAlign:'center',marginBottom:10}}>{lang==='bn'?'বিপজ্জনক এলাকা':lang==='hi'?'खतरनाक क्षेत्र':'Danger Zone'}</T>
        <Pressable onPress={onDeleteAccount} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#FEE2E2',borderRadius:12,paddingVertical:12,gap:6}}>
          <Feather name="trash-2" size={16} color="#EF4444"/>
          <T style={{fontSize:13,fontWeight:'700',color:'#EF4444'}}>{lang==='bn'?'অ্যাকাউন্ট মুছুন':lang==='hi'?'खाता हटाएँ':'Delete Account'}</T>
        </Pressable>
      </View>}
  </ScrollView></KeyboardAvoidingView>}

function WriterFollowers({token,theme:t,lang}:{token:string;theme:Theme;lang:Language}){
  const[followers,setFollowers]=useState<{id:string;username:string;writer_name:string;bio?:string;avatar_url?:string;follower_count?:number;badge?:string}[]>([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{fetchWriterFollowers(token).then(f=>setFollowers(f||[])).finally(()=>setLoading(false))},[token]);
  return <View style={{flex:1}}>
    <T style={{fontSize:16,fontWeight:'900',color:t.ink,marginBottom:14}}>{copy(lang,'followers')}</T>
    {loading?<View style={{alignItems:'center',paddingVertical:40}}><ActivityIndicator color={t.primary}/></View>:
    followers.length===0?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="users" size={28} color={t.muted}/><T style={{fontSize:13,color:t.muted,marginTop:8}}>{lang==='hi'?'कोई अनुसारी नहीं':lang==='en'?'No followers yet':'কোনো অনুসারক নেই'}</T></View>:
    followers.map(w=><View key={w.id} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
      <View style={{width:44,height:44,borderRadius:22,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        {w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:44,height:44,borderRadius:22}}/>:<T style={{fontSize:18,fontWeight:'900',color:t.primary}}>{w.writer_name[0]?.toUpperCase()||'?'}</T>}
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
          <T numberOfLines={1} style={{fontSize:14,fontWeight:'800',color:t.ink}}>{w.writer_name}</T>
          <BadgeIcon badge={w.badge} size={14}/>
        </View>
        <T numberOfLines={1} style={{fontSize:11,color:t.muted,marginTop:1}}>@{w.username}</T>
      </View>
      <View style={{alignItems:'center'}}>
        <Feather name="users" size={12} color={t.muted}/>
        <T style={{fontSize:10,color:t.muted,marginTop:2}}>{w.follower_count||0}</T>
      </View>
    </View>)}
  </View>
}

function WriterNotifs({token,theme:t,lang,deviceID,p}:{token:string;theme:Theme;lang:Language;deviceID:string;p:C}){
  const[notifs,setNotifs]=useState<{id:string;title:string;body:string;type:string;is_read:boolean;url?:string;avatar_url?:string;story_title?:string;story_cover?:string;created_at:string}[]>([]);
  const[loading,setLoading]=useState(true);
  const[selNotif,setSelNotif]=useState<{id:string;title:string;body:string;type:string;is_read:boolean;url?:string;avatar_url?:string;story_title?:string;story_cover?:string;created_at:string}|null>(null);
  const[followedBack,setFollowedBack]=useState<Record<string,boolean>>({});
  useEffect(()=>{fetchWriterNotifications(token).then(n=>setNotifs(n||[])).finally(()=>setLoading(false))},[token]);
  const markAll=async()=>{await markWriterNotificationsRead(token);setNotifs(n=>n.map(x=>({...x,is_read:true})))};
  const deleteNotif=async(id:string)=>{await deleteWriterNotification(token,id);setNotifs(n=>n.filter(x=>x.id!==id))};
  const followBack=async(nid:string,fwid:string)=>{
    const ok=await followWriter(deviceID,fwid,p.state.writer?.id,p.state.user?.id);
    if(ok)setFollowedBack(p=>({...p,[nid]:true}));
  };
  const typeIcon=(type:string)=>type==='approved'?'check-circle':type==='rejected'?'x-circle':type==='warning'?'alert-triangle':type==='removed'?'trash-2':type==='info'?'info':type==='follow'?'user-plus':type==='like'?'heart':type==='comment'?'message-circle':'bell';
  const typeColor=(type:string)=>type==='approved'?'#10B981':type==='rejected'?'#EF4444':type==='warning'?'#F59E0B':type==='removed'?'#DC2626':type==='follow'?'#EC4899':type==='like'?'#EF4444':type==='comment'?'#3B82F6':'#6366F1';
  const openDetail=(n:{id:string;title:string;body:string;type:string;is_read:boolean;url?:string;created_at:string})=>{
    if(!n.is_read){setNotifs(prev=>prev.map(x=>x.id===n.id?{...x,is_read:true}:x));markWriterNotificationsRead(token,[n.id])}
    setSelNotif(n);
  };
  if(selNotif)return <View style={{flex:1}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
        <Pressable onPress={()=>setSelNotif(null)}><Feather name="arrow-left" size={20} color={t.ink}/></Pressable>
        <T style={{fontSize:16,fontWeight:'900',color:t.ink}}>{copy(lang,'notifications')}</T>
      </View>
      <Pressable onPress={()=>{deleteNotif(selNotif.id);setSelNotif(null)}} style={{padding:6}}><Feather name="trash-2" size={16} color="#EF4444"/></Pressable>
    </View>
    <View style={{alignItems:'center',marginBottom:18}}>
      {selNotif.avatar_url?<Image source={{uri:selNotif.avatar_url}} style={{width:56,height:56,borderRadius:28,marginBottom:8}}/>:<View style={{width:56,height:56,borderRadius:28,backgroundColor:typeColor(selNotif.type)+'18',alignItems:'center',justifyContent:'center',marginBottom:8}}>
        <Feather name={typeIcon(selNotif.type) as any} size={24} color={typeColor(selNotif.type)}/>
      </View>}
      <T style={{fontSize:16,fontWeight:'800',color:t.ink,textAlign:'center'}}>{selNotif.title}</T>
      <T style={{fontSize:11,color:t.muted,marginTop:3}}>{new Date(selNotif.created_at).toLocaleString()}</T>
    </View>
    {selNotif.story_cover&&<View style={{alignSelf:'center',marginBottom:14,borderRadius:12,overflow:'hidden'}}><Image source={{uri:selNotif.story_cover}} style={{width:100,height:140,borderRadius:12}} resizeMode="cover"/></View>}
    <View style={{backgroundColor:t.card,borderRadius:14,padding:16,borderWidth:1,borderColor:t.line}}>
      <T style={{fontSize:14,color:t.ink,lineHeight:22}}>{selNotif.body}</T>
    </View>
    {selNotif.type==='follow'&&selNotif.url&&!followedBack[selNotif.id]&&<Pressable onPress={()=>followBack(selNotif.id,selNotif.url!)} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,marginTop:14,backgroundColor:t.primary,borderRadius:12,paddingVertical:12}}>
      <Feather name="user-plus" size={15} color="#fff"/><T style={{fontSize:13,fontWeight:'700',color:'#fff'}}>{copy(lang,'follow')}</T>
    </Pressable>}
  </View>;
  return <View style={{flex:1}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <T style={{fontSize:16,fontWeight:'900',color:t.ink}}>{copy(lang,'notifications')}</T>
      <View style={{flexDirection:'row',gap:8}}>
        {notifs.some(n=>!n.is_read)&&<Pressable onPress={markAll} style={{paddingHorizontal:10,paddingVertical:5,borderRadius:8,backgroundColor:t.tint}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.primary}}>{copy(lang,'markAllRead')}</T>
        </Pressable>}
        {notifs.length>0&&<Pressable onPress={async()=>{const ids=notifs.map(n=>n.id);setNotifs([]);await Promise.all(ids.map(id=>deleteWriterNotification(token,id)))}} style={{paddingHorizontal:5,paddingVertical:5,borderRadius:8,backgroundColor:t.tint}}>
          <Feather name="trash-2" size={13} color="#EF4444"/>
        </Pressable>}
      </View>
    </View>
    {loading?<View style={{alignItems:'center',paddingVertical:40}}><ActivityIndicator color={t.primary}/></View>:
    notifs.length===0?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="bell" size={28} color={t.muted}/><T style={{fontSize:13,color:t.muted,marginTop:8}}>{copy(lang,'noNotifications')}</T></View>:
    notifs.map(n=><Pressable key={n.id} onPress={()=>openDetail(n)} style={{flexDirection:'row',alignItems:'flex-start',backgroundColor:n.is_read?t.card:t.tint,borderRadius:12,padding:12,marginBottom:6,borderWidth:1,borderColor:n.is_read?t.line:t.primary+'30',borderLeftWidth:3,borderLeftColor:typeColor(n.type)}}>
      {n.avatar_url?<Image source={{uri:n.avatar_url}} style={{width:34,height:34,borderRadius:17,marginRight:10}}/>:<View style={{width:30,height:30,borderRadius:8,backgroundColor:typeColor(n.type)+'18',alignItems:'center',justifyContent:'center',marginRight:10}}>
        <Feather name={typeIcon(n.type) as any} size={14} color={typeColor(n.type)}/>
      </View>}
      <View style={{flex:1}}>
        <T numberOfLines={1} style={{fontSize:13,fontWeight:'700',color:t.ink}}>{n.title}</T>
        <T numberOfLines={2} style={{fontSize:12,color:t.muted,marginTop:2,lineHeight:17}}>{n.body}</T>
        <T style={{fontSize:10,color:t.muted,marginTop:4}}>{new Date(n.created_at).toLocaleDateString()}</T>
      </View>
      {!n.is_read&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:t.primary,marginLeft:8,marginTop:4}}/>}
    </Pressable>)}
  </View>}

function Back({title,theme,onPress}:{title:string;theme:Theme;onPress:()=>void}){return <View style={styles.back}><Pressable onPress={onPress}><Feather name="arrow-left" size={22} color={theme.ink}/></Pressable><T style={[styles.backTitle,{color:theme.ink}]}>{title}</T><View style={{width:22}}/></View>}
function Section({title,theme,action,seeAllText}:{title:string;theme:Theme;action?:()=>void;seeAllText?:string}){return <View style={styles.section}><T style={[styles.sectionTitle,{color:theme.ink}]}>{title}</T>{action&&<Pressable onPress={action}><T style={{color:theme.primary,fontWeight:'800',fontSize:12}}>{seeAllText||'See all →'}</T></Pressable>}</View>}
function Cover({book,large}:{book:Book;large?:boolean}){const hideAll=book.hide_title_on_cover&&book.cover_url;return <View style={[styles.cover,large&&styles.coverLarge,{backgroundColor:book.color}]}>{book.cover_url?<Image source={{uri:book.cover_url}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:large?16:9}} resizeMode="cover"/>:null}{!hideAll&&book.cover_url&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:large?16:9,backgroundColor:'rgba(0,0,0,0.15)'}}/>}{!hideAll&&<Feather name={I(book.categoryIcon)} size={large?27:20} color={book.accent}/>}{!hideAll&&!book.hide_title_on_cover&&<T numberOfLines={3} style={[styles.coverTitle,large&&{fontSize:17}]}>{book.title}</T>}{!hideAll&&!book.hide_title_on_cover&&<View style={{height:2,width:24,backgroundColor:book.accent,marginVertical:7}}/>}{!hideAll&&<T style={styles.coverAuthor}>{book.author}</T>}</View>}
function Episode({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){const c=book.chapters[book.chapters.length-1];return <Pressable onPress={onPress} style={[styles.episode,{backgroundColor:theme.card,borderColor:theme.line}]}><Cover book={book}/><View style={{flex:1}}><T style={{color:theme.primary,fontSize:10,fontWeight:'900'}}>নতুন পর্ব</T><T style={[styles.rowTitle,{color:theme.ink}]}>{book.title}</T><T style={{color:theme.muted,fontSize:11,marginTop:4}}>পর্ব {book.chapters.length}: {c?.title||'—'}</T></View><Feather name="play-circle" size={23} color={theme.primary}/></Pressable>}
function Featured(props: C & { list?: Book[] }){const p=props as C;const {width}=useWindowDimensions();const W=width-36;const items=(props.list&&props.list.length?props.list:p.allBooks.slice(0,6));const N=items.length;const anim=useRef(new Animated.Value(0)).current;const idxRef=useRef(0);const[idx,setIdx]=useState(0);const lastTouch=useRef(0);const setter=useCallback((i:number,manual?:boolean)=>{if(manual)lastTouch.current=Date.now();idxRef.current=((i%N)+N)%N;setIdx(idxRef.current)},[N]);useEffect(()=>{Animated.timing(anim,{toValue:-idx*W,duration:550,useNativeDriver:true}).start()},[idx,anim,W]);useEffect(()=>{if(N<2)return;const id=setInterval(()=>{if(Date.now()-lastTouch.current>=4000)setter(idxRef.current+1)},1000);return()=>clearInterval(id)},[N,setter]);const pan=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>false,onMoveShouldSetPanResponder:(_:any,g:{dx:number;dy:number})=>N>1&&Math.abs(g.dx)>12,onPanResponderRelease:(_,g)=>{if(N<2)return;if(g.dx<-50)setter(idxRef.current+1,true);else if(g.dx>50)setter(idxRef.current-1,true)}})).current;if(!N)return null;return <View><View style={{overflow:'hidden',borderRadius:26}}><Animated.View style={{flexDirection:'row',width:W*N,transform:[{translateX:anim}]}} {...pan.panHandlers}>{items.map((b,i)=><View key={b.id} style={{width:W}}><FeaturedCard book={b} p={p} rank={i}/></View>)}</Animated.View></View><View style={{flexDirection:'row',justifyContent:'center',gap:6,marginTop:12}}>{items.map((_,i)=>{const on=i===idx;return <View key={i} style={[styles.dot,{width:on?18:6,backgroundColor:on?'#C9972B':p.theme.line}]}/>})}</View></View>}
function shade(hex:string,amt:number):string{const h=hex.replace('#','');if(h.length!==6)return hex;const n=parseInt(h,16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;const t=amt<0?0:255;const q=Math.abs(amt)/100;r=Math.round((t-r)*q+r);g=Math.round((t-g)*q+g);b=Math.round((t-b)*q+b);const z=(x:number)=>('0'+x.toString(16)).slice(-2);return '#'+z(r)+z(g)+z(b)}
function FeaturedCard({book,p,rank}:{book:Book;p:C;rank:number}){const accent='#C9972B';const isBm=p.state.bookmarks.includes(book.id);const bmScale=React.useRef(new Animated.Value(1)).current;const burstScale=React.useRef(new Animated.Value(0.5)).current;const burstOp=React.useRef(new Animated.Value(0)).current;const readScale=React.useRef(new Animated.Value(1)).current;const readIn=()=>{Animated.spring(readScale,{toValue:0.93,friction:5,tension:300,useNativeDriver:true}).start()};const readOut=()=>{Animated.spring(readScale,{toValue:1,friction:5,tension:300,useNativeDriver:true}).start()};const bmAnim=(added:boolean)=>{if(added){burstScale.setValue(0.5);burstOp.setValue(0.85);Vibration.vibrate(20);Animated.parallel([Animated.sequence([Animated.timing(bmScale,{toValue:0.55,duration:90,useNativeDriver:true}),Animated.spring(bmScale,{toValue:1,friction:4,tension:220,useNativeDriver:true})]),Animated.parallel([Animated.timing(burstScale,{toValue:1.7,duration:450,useNativeDriver:true}),Animated.timing(burstOp,{toValue:0,duration:450,useNativeDriver:true})])]).start()}else{Animated.sequence([Animated.timing(bmScale,{toValue:0.7,duration:90,useNativeDriver:true}),Animated.spring(bmScale,{toValue:1,friction:5,tension:200,useNativeDriver:true})]).start()}};const open=()=>p.open(book.id);const toggleBm=()=>{const adding=!isBm;bmAnim(adding);p.update({bookmarks:adding?[...p.state.bookmarks,book.id]:p.state.bookmarks.filter(x=>x!==book.id)})};const metaW=book.views_visible!==false;const readLabel=p.state.settings.language==='hi'?'अभी पढ़ें':p.state.settings.language==='en'?'Read Now':'এখনই পড়ুন';return <View style={featStyles.card}>{book.cover_url?<Image source={{uri:book.cover_url}} style={StyleSheet.absoluteFill} blurRadius={28} resizeMode="cover" fadeDuration={0}/>:null}<LinearGradient colors={['rgba(123,30,43,0.42)','rgba(43,10,18,0.93)']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/><View style={featStyles.row}><View style={featStyles.left}><View style={featStyles.rank}><T style={featStyles.rankText}>#{rank+1}</T></View><View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:4}}><View style={[featStyles.pill,{flexShrink:1}]}><T style={featStyles.pillText} numberOfLines={1}>{book.category||tr(p,'popular')}</T></View>
              {book.writer_status==='ongoing'&&<View style={featStyles.pill}><T style={featStyles.pillText}>ধারাবাহিক</T></View>}
              {book.writer_status==='complete'&&<View style={featStyles.pill}><T style={featStyles.pillText}>সম্পূর</T></View>}
            </View><T numberOfLines={2} style={featStyles.title}>{book.title}</T><T numberOfLines={1} style={featStyles.author}>{book.author}</T><View style={featStyles.meta}>{metaW&&<View style={featStyles.metaC}><Feather name="eye" size={11} color="#F3E4D8"/><T style={featStyles.metaT}>{book.views}</T></View>}<View style={featStyles.metaC}><Feather name="star" size={11} color={accent}/><T style={featStyles.metaT}>{book.rating}</T></View></View><View style={featStyles.bmRow}><Animated.View style={{transform:[{scale:readScale}]}}><Pressable onPress={()=>p.open(book.id)} onPressIn={readIn} onPressOut={readOut} style={featStyles.btn}><Feather name="book-open" size={13} color="#4A1220"/><T style={featStyles.btnText}>{readLabel}</T></Pressable></Animated.View><View style={{width:36,height:36,alignItems:'center',justifyContent:'center'}}><Animated.View pointerEvents="none" style={[featStyles.burst,{opacity:burstOp,transform:[{scale:burstScale}]}]}/><Animated.View style={{transform:[{scale:bmScale}]}}><Pressable onPress={toggleBm} hitSlop={12} accessibilityRole="button" accessibilityLabel="bookmark" style={[featStyles.bm,{borderColor:isBm?accent:'#ffffff44',backgroundColor:isBm?'#C9972B33':'rgba(20,5,10,0.45)'}]}><Feather name="bookmark" size={16} color={isBm?accent:'#fff'}/></Pressable></Animated.View></View></View></View><Pressable onPress={open} style={featStyles.coverWrap}>{book.cover_url?<Image source={{uri:book.cover_url}} style={featStyles.coverImg}/>:<View style={featStyles.coverImg}><Feather name={I(book.categoryIcon)} size={30} color={accent}/></View>}</Pressable></View></View>}
function MpCard({b,accent,cardW,onOpen,isBm,onToggle}:{b:Book;accent:string;cardW:number;onOpen:()=>void;isBm:boolean;onToggle:()=>void}){
  const bmScale=React.useRef(new Animated.Value(1)).current;
  const bmAnim=()=>{
    Animated.sequence([
      Animated.timing(bmScale,{toValue:0.5,duration:100,useNativeDriver:true}),
      Animated.spring(bmScale,{toValue:1,friction:3,tension:300,useNativeDriver:true})
    ]).start()
  };
  const toggleBm=()=>{bmAnim();onToggle()};
  const bookColor=b.accent||b.color||accent;
  const darker=shade(bookColor,-40);
  return <Pressable onPress={onOpen} style={{width:cardW,height:160,borderRadius:16,overflow:'hidden',position:'relative'}}>
    {b.cover_url
      ?<Image source={{uri:b.cover_url}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,width:'100%',height:'100%'}} blurRadius={30} resizeMode="cover"/>
      :<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:darker}}/>}
    <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#00000077'}}/>
    <LinearGradient colors={['#00000055',darker+'CC']} start={{x:0,y:0}} end={{x:1,y:1}} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
    {b.display_status&&<View style={{position:'absolute',top:0,right:0,zIndex:2,borderTopRightRadius:16,borderBottomLeftRadius:12,backgroundColor:b.display_status==='new'?'#8B5CF6CC':'#10B981CC',paddingHorizontal:10,paddingVertical:5}}><T style={{fontSize:9,fontWeight:'900',color:'#fff',letterSpacing:0.3}}>{b.display_status==='new'?'নতুন':'চলমান'}</T></View>}
    <View style={{flexDirection:'row',flex:1,padding:10}}>
      <View style={{width:85,height:128,borderRadius:10,overflow:'hidden',marginRight:10,alignSelf:'center',backgroundColor:b.color||darker}}>
        {b.cover_url
          ?<Image source={{uri:b.cover_url}} style={{width:'100%',height:'100%',borderRadius:10}} resizeMode="cover"/>
          :<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Feather name={I(b.categoryIcon||'book-open')} size={28} color={b.accent||'#fff'}/></View>}
      </View>
      <View style={{flex:1,justifyContent:'center'}}>
        <T numberOfLines={2} style={{fontSize:15,fontWeight:'800',color:'#fff',lineHeight:20,marginBottom:4}}>{b.title}</T>
        <T numberOfLines={1} style={{fontSize:11,fontWeight:'600',color:'#ffffffBB',marginBottom:7}}>{b.author}</T>
        <View style={{flexDirection:'row',alignItems:'center',gap:7,marginBottom:10}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
            <Feather name="eye" size={11} color="#ffffffBB"/>
            <T style={{fontSize:11,fontWeight:'700',color:'#ffffffDD'}}>{b.views}</T>
          </View>
          <View style={{width:3,height:3,borderRadius:1.5,backgroundColor:'#ffffff55'}}/>
          <T style={{fontSize:11,fontWeight:'600',color:'#ffffffBB'}}>{b.category||'গল্প'}</T>
          <View style={{width:3,height:3,borderRadius:1.5,backgroundColor:'#ffffff55'}}/>
          <T style={{fontSize:11,fontWeight:'600',color:'#ffffffBB'}}>{b.writer_status==='complete'?'সম্পূর্ণ':b.writer_status==='ongoing'?'ধারাবাহিক':''}</T>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Pressable onPress={onOpen} style={{flex:1,backgroundColor:'#fff',borderRadius:12,height:34,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5}}>
            <Feather name='book-open' size={13} color={darker}/>
            <T style={{fontSize:13,fontWeight:'800',color:darker}}>পড়ুন</T>
          </Pressable>
          <Animated.View style={{transform:[{scale:bmScale}]}}>
            <Pressable onPress={toggleBm} hitSlop={8} style={{width:34,height:34,borderRadius:17,borderWidth:1.5,borderColor:isBm?'#C9972B':'#ffffff44',backgroundColor:isBm?'#C9972B33':'transparent',alignItems:'center',justifyContent:'center'}}>
              <Feather name="bookmark" size={14} color={isBm?'#C9972B':'#fff'}/>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  </Pressable>
}

const MostPopularCarousel=React.memo(function MostPopularCarousel({books,theme,lang,accent,onOpen,title,onSeeAll,bookmarks,onUpdate}:{books:Book[];theme:Theme;lang:Language;accent:string;onOpen:(id:string)=>void;title:string;onSeeAll:()=>void;bookmarks:string[];onUpdate:(ids:string[])=>void}){
  const scrollX=React.useRef(new Animated.Value(0)).current;
  const CARD_W=Dimensions.get('window').width-70;
  return <View style={{marginBottom:8}}>
    <View style={styles.secHead}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
        <View style={[styles.secIcon,{backgroundColor:shade(accent,-30)}]}>
          <Feather name="trending-up" size={13} color="#fff"/>
        </View>
        <T style={[styles.sectionTitle,{color:theme.ink}]}>{title}</T>
      </View>
      <Pressable onPress={onSeeAll} style={[styles.seeAllPill,{backgroundColor:shade(accent,-30)}]}>
        <T style={{color:'#fff',fontWeight:'900',fontSize:12,letterSpacing:0.3}}>সব দেখুন</T>
      </Pressable>
    </View>
    <Animated.FlatList
      data={books}
      keyExtractor={(b:any)=>b.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_W+12}
      decelerationRate="fast"
      contentContainerStyle={{paddingHorizontal:18,gap:12}}
      onScroll={Animated.event([{nativeEvent:{contentOffset:{x:scrollX}}}],{useNativeDriver:true})}
      renderItem={({item}:{item:Book})=>{
        const isBm=bookmarks.includes(item.id);
        return <MpCard b={item} accent={accent} cardW={CARD_W} onOpen={()=>onOpen(item.id)} isBm={isBm} onToggle={()=>onUpdate(isBm?bookmarks.filter(x=>x!==item.id):[...bookmarks,item.id])}/>
      }}
    />
    <View style={{flexDirection:'row',justifyContent:'center',marginTop:10,gap:5}}>
      {books.map((_:any,i:number)=>{
        const inputRange=[(CARD_W+12)*(i-1),(CARD_W+12)*i,(CARD_W+12)*(i+1)];
        const dotOp=scrollX.interpolate({inputRange,outputRange:[0.3,1,0.3],extrapolate:'clamp'});
        const dotScale=scrollX.interpolate({inputRange,outputRange:[0.7,1.3,0.7],extrapolate:'clamp'});
        return <Animated.View key={i} style={{width:4,height:4,borderRadius:2,backgroundColor:accent,opacity:dotOp,transform:[{scale:dotScale}]}}/>;
      })}
    </View>
  </View>
})

const BookCard=React.memo(function BookCard({book,theme,lang,rank,accent,onPress,section,openWithAnim}:{book:Book;theme:Theme;lang:Language;rank?:number;accent?:string;onPress:()=>void;section?:string;openWithAnim?:C['openWithAnim']}){const ref=React.useRef<View>(null);const handlePress=()=>{if(openWithAnim&&ref.current){ref.current.measure((_fx:number,_fy:number,w:number,h:number,px:number,py:number)=>{openWithAnim(book,px,py,w,h)})}else{onPress()}};const hasStatus=Boolean(book.display_status);const showBadge=hasStatus&&(section==='newEpisodes'||section==='mostPopular');return <Pressable ref={ref} onPress={handlePress} style={{width:130}}><View style={{position:'relative'}}><Cover book={book}/>{typeof rank==='number'?<View style={[styles.rankBadge,{backgroundColor:rank===0?accent:rank===1?accent:rank<3?(accent||'#888')+'DD':'#555555DD'}]}><T style={[styles.rankBadgeText,{color:rank<2?'#fff':'#fff'}]}>{rank+1}</T></View>:showBadge&&<View style={[styles.statusBadge,{backgroundColor:book.display_status==='new'?'#8B5CF6':'#10B981'}]}><T style={[styles.statusBadgeText,{color:'#fff'}]}>{book.display_status==='new'?copy(lang,'statusNew'):copy(lang,'statusOngoing')}</T></View>}{book.views_visible !== false && <View style={styles.viewBadge}><Feather name="eye" size={10} color="#fff"/><T style={styles.viewBadgeText}>{book.views}</T></View>}</View><T numberOfLines={2} style={[styles.bookName,{color:theme.ink}]}>{book.title}</T><T numberOfLines={1} style={{color:theme.muted,fontSize:11}}>{book.author}</T></Pressable>});
function GoogleIcon({size}:{size?:number}){
  const s=size||20;
  return <Svg width={s} height={s} viewBox="0 0 48 48">
    <Path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <Path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <Path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <Path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </Svg>;
}
function BadgeIcon({badge,size}:{badge?:string;size?:number}){
  if(!badge||badge==='none')return null;
  const s=size||18;
  if(badge==='verified')return <Image source={require('./assets/verified-badge.png')} style={{width:s,height:s}}/>;
  if(badge==='popular')return <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M22.5 12.5c0-1.58-1.2-2.87-2.75-3.02C19.36 6.72 18.18 4.14 15.96 2.71 13.74 1.28 10.99 1.35 8.79 2.88 6.59 4.41 5.55 7.19 6.14 9.87 4.28 10.36 2.82 11.97 2.5 14c-.32 2.03.66 4.09 2.44 5.22 1.78 1.13 4.07 1.18 5.9.16.43.95 1.18 1.77 2.16 2.33.98.56 2.14.84 3.3.84 1.58 0 3.07-.6 4.21-1.7 1.14-1.1 1.77-2.59 1.77-4.17 0-.29-.04-.57-.11-.85.99-.78 1.7-1.94 1.88-3.28.18-1.34-.32-2.72-1.36-3.73z" fill="#800020"/><Path d="M10 15.5l-3.5-3.5 1.41-1.41L10 12.67l5.09-5.09 1.41 1.41L10 15.5z" fill="#fff"/></Svg>;
  if(badge==='top')return <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M12 2l2.4 2.4L18 3.2l.8 3.6 3.2 1.6-1.6 3.2L22 15l-3.2 1.6-.8 3.6-3.6-.8L12 22l-2.4-2.4L6 20.8l-.8-3.6L2 15.6l1.6-3.2L2 9l3.2-1.6.8-3.6L10.4 4.4z" fill="#1B5E20"/><Path d="M8 12.5l2.5 2.5L16 9.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
  return null;
}
function AuthorCard({writer,theme,lang,onPress,bookCount,isFollowed,onToggleFollow}:{writer:import('./src/types').WriterProfile;theme:Theme;lang:Language;onPress:()=>void;bookCount:number;isFollowed?:boolean;onToggleFollow?:()=>void}){
  const bg=theme.tint;const ring=theme.primary;const suppressRef=useRef(false);
  return <Pressable onPress={()=>{if(suppressRef.current){suppressRef.current=false;return}onPress()}} style={[dStyles.writerCard,{backgroundColor:theme.card,borderColor:theme.line}]}>
    <View style={[dStyles.writerCardBg,{backgroundColor:bg}]}/>
    <View style={dStyles.writerAvatarWrap}>
      <View style={[dStyles.writerAvatar,{borderColor:theme.card,backgroundColor:bg}]}>
        {writer.avatar_url?<Image source={{uri:writer.avatar_url}} style={StyleSheet.absoluteFill}/>:<T style={{fontSize:22,fontWeight:'900',color:ring}}>{writer.writer_name[0]?.toUpperCase()||'?'}</T>}
      </View>
    </View>
    <View style={dStyles.writerCardBody}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4}}>
        <T numberOfLines={1} style={[dStyles.writerName,{color:theme.ink}]}>{writer.writer_name}</T>
        <BadgeIcon badge={writer.badge} size={13}/>
      </View>
      <T numberOfLines={1} style={[dStyles.writerUsername,{color:theme.muted}]}>@{writer.username}</T>
      <View style={[dStyles.writerStatsRow,{borderColor:theme.line}]}>
        <View style={dStyles.writerStat}><Feather name="book-open" size={11} color={theme.primary}/><T style={[dStyles.writerStatNum,{color:theme.ink}]}>{bookCount}</T><T style={[dStyles.writerStatLabel,{color:theme.muted}]}>{copy(lang,'books')}</T></View>
        <View style={dStyles.writerStat}><Feather name="users" size={11} color={theme.primary}/><T style={[dStyles.writerStatNum,{color:theme.ink}]}>{writer.follower_count||0}</T><T style={[dStyles.writerStatLabel,{color:theme.muted}]}>{copy(lang,'followers')}</T></View>
      </View>
      {onToggleFollow&&<Pressable onPress={()=>{suppressRef.current=true;onToggleFollow()}} style={{marginTop:8,alignSelf:'stretch',borderRadius:10,paddingVertical:9,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:5,backgroundColor:isFollowed?'transparent':theme.primary,borderWidth:1.5,borderColor:theme.primary}}>{isFollowed&&<Feather name="check" size={12} color={theme.primary}/>}<T style={{fontSize:12,fontWeight:'900',color:isFollowed?theme.primary:'#fff'}}>{isFollowed?'ফলো করা':'ফলো করুন'}</T></Pressable>}
    </View>
  </Pressable>}
function Row({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.row,{backgroundColor:theme.card,borderColor:theme.line}]}><Cover book={book}/><View style={{flex:1}}><T style={[styles.rowTitle,{color:theme.ink}]}>{book.title}</T><T style={{color:theme.primary,fontSize:12,marginTop:4}}>{book.author}</T><View style={{flexDirection:'row',alignItems:'center',gap:3}}><Feather name="eye" size={12} color={theme.muted}/><T style={{color:theme.muted,fontSize:11}}>{book.views_visible !== false ? `${book.views} • ${book.category}` : book.category}</T></View></View><Feather name="chevron-right" size={18} color={theme.muted}/></Pressable>}
function Link({title,icon,n,theme,onPress}:{title:string;icon:string;n:number;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.link,{backgroundColor:theme.card,borderColor:theme.line}]}><View style={[styles.linkIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={20} color={theme.primary}/></View><T style={[styles.rowTitle,{color:theme.ink}]}>{title}</T><T style={{color:theme.muted,fontSize:10}}>{n}টি</T></Pressable>}
function Menu({title,icon,theme,onPress}:{title:string;icon:string;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.menu,{backgroundColor:theme.card,borderBottomColor:theme.line}]}><View style={[styles.menuIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={17} color={theme.primary}/></View><T style={[styles.rowTitle,{color:theme.ink,flex:1}]}>{title}</T><Feather name="chevron-right" size={18} color={theme.muted}/></Pressable>}
function Toggle({title,icon,value,theme,onChange}:{title:string;icon:string;value:boolean;theme:Theme;onChange:(v:boolean)=>void}){return <View style={[styles.menu,{backgroundColor:theme.card,borderBottomColor:theme.line}]}><View style={[styles.menuIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={17} color={theme.primary}/></View><T style={[styles.rowTitle,{color:theme.ink,flex:1}]}>{title}</T><Switch value={value} onValueChange={onChange} trackColor={{true:theme.primary}}/></View>}
function Action({icon,label,active,theme,onPress}:{icon:string;label:string;active:boolean;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={{alignItems:'center',gap:5}}><View style={[styles.action,{backgroundColor:active?theme.primary:theme.card,borderColor:theme.line}]}><Feather name={I(icon)} size={17} color={active?'#fff':theme.ink}/></View><T style={{color:active?theme.primary:theme.muted,fontSize:10,fontWeight:'800'}}>{label}</T></Pressable>}
function Button({title,icon,disabled,onPress}:{title:string;icon:string;disabled?:boolean;onPress:()=>void}){return <Pressable disabled={disabled} onPress={onPress} style={[styles.button,disabled&&{opacity:.4}]}><T style={styles.buttonText}>{title}</T><Feather name={I(icon)} size={18} color="#fff"/></Pressable>}
function Empty({theme}:{theme:Theme}){return <View style={styles.empty}><Feather name="book" size={28} color={theme.primary}/><T style={[styles.rowTitle,{color:theme.ink,marginTop:10}]}>এখানে এখনো কিছু নেই</T><T style={{color:theme.muted,marginTop:5}}>গল্প পড়তে শুরু করুন</T></View>}
function FlowerArt({kind,primary,tint,bg,s=40}:{kind:string;primary:string;tint:string;bg:string;s?:number}){
  const petal=(ang:number,rx:number,ry:number,col:string,op=0.92,pad=0)=><Ellipse cx={50} cy={50-ry-pad} rx={rx} ry={ry} fill={col} opacity={op} transform={`rotate(${ang} 50 50)`}/>;
  const R=(n:number)=>(()=>{const a:number[]=[];for(let i=0;i<n;i++)a.push((360/n)*i);return a})();
  const ring=(n:number,rx:number,ry:number,col:string,op=0.92,pad=0)=>R(n).map(x=>(<Ellipse key={x} cx={50} cy={50-ry-pad} rx={rx} ry={ry} fill={col} opacity={op} transform={`rotate(${x} 50 50)`}/>));
  return <Svg width={s} height={s} viewBox="0 0 100 100">
    <Circle cx={50} cy={50} r={49} fill={bg}/>
    {kind==='golap'
      ? <G>{ring(18,11,22,primary,0.55)}<G>{ring(9,10,18,tint,0.7,2)}</G><Circle cx={50} cy={50} r={9} fill={bg}/></G>
      : <G>{ring(8,12,28,primary)}<G>{ring(6,9,20,tint,0.85,7)}</G><Circle cx={50} cy={50} r={8} fill="#E8C33A"/></G>}
  </Svg>;
}

function ThemeSVGIcon({themeId,s=34,color='#fff'}:{themeId:string;s?:number;color?:string}){
  const c=color;
  const o=(p=0.9)=><G opacity={p}/>;
  switch(themeId){
    case 'nilkantha':return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={49} fill="transparent"/><Path d="M25 60 Q50 20 75 60" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round"/><Path d="M30 55 Q50 30 70 55" stroke={c} strokeWidth="2" fill="none" opacity={0.6} strokeLinecap="round"/><Circle cx={50} cy={42} r={4} fill={c}/><Path d="M42 68 L50 62 L58 68" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/></Svg>;
    case 'kashful':return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={49} fill="transparent"/><Path d="M50 80 L50 30" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><Path d="M50 30 Q40 20 35 25 Q30 30 40 35 Q45 37 50 30" fill={c} opacity={0.8}/><Path d="M50 40 Q60 30 65 35 Q70 40 60 45 Q55 47 50 40" fill={c} opacity={0.6}/><Path d="M50 50 Q38 42 33 47 Q28 52 38 55 Q44 56 50 50" fill={c} opacity={0.4}/></Svg>;
    case 'mala':return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={49} fill="transparent"/><Circle cx={50} cy={25} r={5} fill={c}/><Circle cx={35} cy={32} r={4} fill={c} opacity={0.8}/><Circle cx={65} cy={32} r={4} fill={c} opacity={0.8}/><Circle cx={28} cy={45} r={4.5} fill={c} opacity={0.7}/><Circle cx={72} cy={45} r={4.5} fill={c} opacity={0.7}/><Circle cx={30} cy={60} r={4} fill={c} opacity={0.6}/><Circle cx={70} cy={60} r={4} fill={c} opacity={0.6}/><Circle cx={38} cy={73} r={3.5} fill={c} opacity={0.5}/><Circle cx={62} cy={73} r={3.5} fill={c} opacity={0.5}/><Circle cx={50} cy={80} r={5} fill={c}/></Svg>;
    case 'meghdoot':return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={49} fill="transparent"/><Ellipse cx={40} cy={45} rx={18} ry={12} fill={c} opacity={0.7}/><Ellipse cx={58} cy={42} rx={15} ry={10} fill={c} opacity={0.5}/><Ellipse cx={48} cy={38} rx={12} ry={8} fill={c} opacity={0.9}/><Path d="M35 65 L35 75" stroke={c} strokeWidth="1.5" opacity={0.4} strokeLinecap="round"/><Path d="M45 62 L45 78" stroke={c} strokeWidth="1.5" opacity={0.3} strokeLinecap="round"/><Path d="M55 64 L55 76" stroke={c} strokeWidth="1.5" opacity={0.4} strokeLinecap="round"/></Svg>;
    case 'bashanti':return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={49} fill="transparent"/><Path d="M50 75 L50 45" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><Path d="M50 45 Q35 30 40 22 Q45 18 50 30 Q55 18 60 22 Q65 30 50 45" fill={c} opacity={0.8}/><Path d="M50 55 Q38 48 35 42 Q40 40 45 48" fill={c} opacity={0.5}/><Path d="M50 60 Q62 53 65 47 Q60 45 55 53" fill={c} opacity={0.5}/></Svg>;
    case 'sona':return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={49} fill="transparent"/><Path d="M50 20 L60 40 L80 45 L65 60 L68 80 L50 72 L32 80 L35 60 L20 45 L40 40 Z" stroke={c} strokeWidth="2" fill="none" strokeLinejoin="round"/><Circle cx={50} cy={50} r={8} fill={c} opacity={0.6}/></Svg>;
    case 'rong':return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={49} fill="transparent"/><Circle cx={42} cy={40} r={12} fill={c} opacity={0.7}/><Circle cx={58} cy={38} r={10} fill={c} opacity={0.5}/><Circle cx={50} cy={55} r={14} fill={c} opacity={0.4}/><Circle cx={38} cy={58} r={8} fill={c} opacity={0.6}/><Circle cx={62} cy={55} r={9} fill={c} opacity={0.3}/></Svg>;
    case 'agun':return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={49} fill="transparent"/><Path d="M50 20 Q55 35 60 40 Q65 45 60 55 Q70 48 65 38 Q72 42 68 55 Q62 70 50 80 Q38 70 32 55 Q28 42 35 38 Q30 48 40 55 Q35 45 40 40 Q45 35 50 20" fill={c} opacity={0.85}/><Path d="M50 45 Q53 52 55 55 Q58 60 50 68 Q42 60 45 55 Q48 52 50 45" fill={c} opacity={0.5}/></Svg>;
    case 'swapna':return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={49} fill="transparent"/><Circle cx={50} cy={45} r={20} stroke={c} strokeWidth="2" fill="none" opacity={0.6}/><Circle cx={50} cy={45} r={14} stroke={c} strokeWidth="1.5" fill="none" opacity={0.4}/><Circle cx={50} cy={45} r={8} fill={c} opacity={0.7}/><Circle cx={35} cy={65} r={2} fill={c} opacity={0.4}/><Circle cx={65} cy={68} r={1.5} fill={c} opacity={0.3}/><Circle cx={42} cy={72} r={1} fill={c} opacity={0.5}/></Svg>;
    case 'prithvi':return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={49} fill="transparent"/><Path d="M20 70 L35 45 L45 55 L55 35 L65 50 L80 40 L80 70 Z" fill={c} opacity={0.6}/><Path d="M15 70 L30 52 L42 60 L55 42 L68 55 L85 45 L85 70 Z" fill={c} opacity={0.35}/><Circle cx={70} cy={30} r={5} fill={c} opacity={0.8}/></Svg>;
    default:return <Svg width={s} height={s} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={8} fill={c}/></Svg>;
  }
}
type ThemeId = import('./src/types').ThemeId;
const themePalettes:Record<ThemeId,{light:{dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string};dark:{dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string}}>={
katagolap:{light:{dark:false,primary:'#7B1E2B',bg:'#FAF6F1',card:'#FFFFFF',ink:'#241A1C',muted:'#8A7B7E',line:'#EADFD9',tint:'#F6E3DC',reader:'#FDFBF7'},dark:{dark:true,primary:'#C96F7B',bg:'#171113',card:'#22181B',ink:'#F5ECEE',muted:'#A08E93',line:'#3A2B2F',tint:'#3A222A',reader:'#141013'}},
sepia:{light:{dark:false,primary:'#8B6914',bg:'#FBF7F0',card:'#FFFFFF',ink:'#2C2416',muted:'#8C7E6A',line:'#E8DFD0',tint:'#F3EDE0',reader:'#FDFBF7'},dark:{dark:true,primary:'#D4A843',bg:'#1A1508',card:'#241E12',ink:'#F0E8D8',muted:'#9A8B6E',line:'#3A3220',tint:'#2E2714',reader:'#16120A'}},
midnight:{light:{dark:false,primary:'#4A6CF7',bg:'#F4F6FF',card:'#FFFFFF',ink:'#1A1F36',muted:'#6B7394',line:'#D8DDF0',tint:'#E4E8F8',reader:'#FAFBFF'},dark:{dark:true,primary:'#7B96FF',bg:'#0B0E1A',card:'#151A2E',ink:'#E8ECFF',muted:'#6B7394',line:'#262D4A',tint:'#1C2240',reader:'#0D1020'}},
godhuli:{light:{dark:false,primary:'#C05621',bg:'#FFF8F3',card:'#FFFFFF',ink:'#2D1B0E',muted:'#8C6E56',line:'#EDD8C8',tint:'#F8EDE2',reader:'#FFFCF9'},dark:{dark:true,primary:'#ED8936',bg:'#1A0F06',card:'#261A0E',ink:'#F8E8D8',muted:'#9A7E60',line:'#3A2E1E',tint:'#2E2214',reader:'#160E08'}},
sagar:{light:{dark:false,primary:'#1A7FA0',bg:'#F2FAFD',card:'#FFFFFF',ink:'#0F2B33',muted:'#5C8A96',line:'#C8E2EA',tint:'#D8EFF5',reader:'#F8FCFD'},dark:{dark:true,primary:'#38B2D6',bg:'#061218',card:'#0E1E24',ink:'#D8F0F8',muted:'#5C8A96',line:'#1E3440',tint:'#142A32',reader:'#081418'}},
oronno:{light:{dark:false,primary:'#2D7A3A',bg:'#F3FAF4',card:'#FFFFFF',ink:'#1A2E1E',muted:'#5C7A60',line:'#C8E4CC',tint:'#D8F0DA',reader:'#F8FCF9'},dark:{dark:true,primary:'#4CAF5A',bg:'#0A1A0C',card:'#142816',ink:'#D8F0DC',muted:'#5C7A60',line:'#1E3420',tint:'#162C18',reader:'#0C1C0E'}},
lavender:{light:{dark:false,primary:'#7C3AED',bg:'#F8F5FF',card:'#FFFFFF',ink:'#1E1533',muted:'#7C6E94',line:'#DDD4F0',tint:'#ECE6F8',reader:'#FCFAFF'},dark:{dark:true,primary:'#A78BFA',bg:'#120E1E',card:'#1C1530',ink:'#EDE6FF',muted:'#7C6E94',line:'#302848',tint:'#241E3C',reader:'#141020'}},
golapi:{light:{dark:false,primary:'#D94A7A',bg:'#FFF5F8',card:'#FFFFFF',ink:'#2E1520',muted:'#8C5E72',line:'#F0D0DC',tint:'#F8E2EA',reader:'#FFFAFC'},dark:{dark:true,primary:'#F472B6',bg:'#1A0C12',card:'#281520',ink:'#FFE8F0',muted:'#8C5E72',line:'#3E2430',tint:'#301C28',reader:'#1C0E14'}},
  shapla:{light:{dark:false,primary:'#0E9AA7',bg:'#F0FBFD',card:'#FFFFFF',ink:'#0E2A2E',muted:'#5C848C',line:'#C8E8EC',tint:'#D9F2F5',reader:'#F6FCFD'},dark:{dark:true,primary:'#2EC4C9',bg:'#071A1D',card:'#0F282C',ink:'#DCF5F7',muted:'#5C848C',line:'#1E3E42',tint:'#133235',reader:'#091B1E'}},
  golap:{light:{dark:false,primary:'#E63946',bg:'#FFF6F7',card:'#FFFFFF',ink:'#3A1520',muted:'#99505C',line:'#F0CCD2',tint:'#F9E3E7',reader:'#FFFBFC'},dark:{dark:true,primary:'#FF6B7A',bg:'#20090F',card:'#33121C',ink:'#FFE7EC',muted:'#99505C',line:'#4A1E28',tint:'#3A1620',reader:'#220B11'}},
  nilkantha:{light:{dark:false,primary:'#2563EB',bg:'#F0F4FF',card:'#FFFFFF',ink:'#1E293B',muted:'#64748B',line:'#CBD5E1',tint:'#DBEAFE',reader:'#F8FAFC'},dark:{dark:true,primary:'#60A5FA',bg:'#0C1222',card:'#151D33',ink:'#E2E8F0',muted:'#94A3B8',line:'#1E3A5F',tint:'#172554',reader:'#0F172A'}},
  kashful:{light:{dark:false,primary:'#78716C',bg:'#FAFAF9',card:'#FFFFFF',ink:'#1C1917',muted:'#A8A29E',line:'#E7E5E4',tint:'#F5F5F4',reader:'#FFFFFF'},dark:{dark:true,primary:'#D6D3D1',bg:'#1C1917',card:'#292524',ink:'#F5F5F4',muted:'#A8A29E',line:'#44403C',tint:'#292524',reader:'#1C1917'}},
  mala:{light:{dark:false,primary:'#D97706',bg:'#FFFBEB',card:'#FFFFFF',ink:'#78350F',muted:'#92400E',line:'#FDE68A',tint:'#FEF3C7',reader:'#FFFEF5'},dark:{dark:true,primary:'#FBBF24',bg:'#1C1205',card:'#2A1D0A',ink:'#FEF3C7',muted:'#D97706',line:'#78350F',tint:'#3B2506',reader:'#1A1005'}},
  meghdoot:{light:{dark:false,primary:'#0EA5E9',bg:'#F0F9FF',card:'#FFFFFF',ink:'#0C4A6E',muted:'#0369A1',line:'#BAE6FD',tint:'#E0F2FE',reader:'#F8FBFF'},dark:{dark:true,primary:'#38BDF8',bg:'#082F49',card:'#0C3547',ink:'#E0F2FE',muted:'#0EA5E9',line:'#075985',tint:'#0C4A6E',reader:'#0A1E2E'}},
  bashanti:{light:{dark:false,primary:'#CA8A04',bg:'#FEFCE8',card:'#FFFFFF',ink:'#713F12',muted:'#A16207',line:'#FDE047',tint:'#FEF9C3',reader:'#FFFEF5'},dark:{dark:true,primary:'#FACC15',bg:'#1A1705',card:'#28230A',ink:'#FEF9C3',muted:'#CA8A04',line:'#854D0E',tint:'#3B3606',reader:'#181405'}},
  sona:{light:{dark:false,primary:'#B45309',bg:'#FFFBEB',card:'#FFFFFF',ink:'#78350F',muted:'#92400E',line:'#FDE68A',tint:'#FEF3C7',reader:'#FFFEF5'},dark:{dark:true,primary:'#F59E0B',bg:'#1C1205',card:'#2A1D0A',ink:'#FEF3C7',muted:'#B45309',line:'#78350F',tint:'#3B2506',reader:'#1A1005'}},
  rong:{light:{dark:false,primary:'#7C3AED',bg:'#F5F3FF',card:'#FFFFFF',ink:'#2E1065',muted:'#6D28D9',line:'#DDD6FE',tint:'#EDE9FE',reader:'#FAFAFF'},dark:{dark:true,primary:'#A78BFA',bg:'#130D25',card:'#1E1538',ink:'#EDE9FE',muted:'#7C3AED',line:'#4C1D95',tint:'#231742',reader:'#100B1E'}},
  agun:{light:{dark:false,primary:'#DC2626',bg:'#FEF2F2',card:'#FFFFFF',ink:'#7F1D1D',muted:'#B91C1C',line:'#FECACA',tint:'#FEE2E2',reader:'#FFFCFC'},dark:{dark:true,primary:'#F87171',bg:'#1C0B0B',card:'#2A1212',ink:'#FEE2E2',muted:'#DC2626',line:'#7F1D1D',tint:'#3B1515',reader:'#1A0A0A'}},
  swapna:{light:{dark:false,primary:'#A855F7',bg:'#FAF5FF',card:'#FFFFFF',ink:'#3B0764',muted:'#7E22CE',line:'#E9D5FF',tint:'#F3E8FF',reader:'#FDFBFF'},dark:{dark:true,primary:'#C084FC',bg:'#170D25',card:'#221438',ink:'#F3E8FF',muted:'#A855F7',line:'#581C87',tint:'#2A1742',reader:'#130B1E'}},
  prithvi:{light:{dark:false,primary:'#65A30D',bg:'#F7FEE7',card:'#FFFFFF',ink:'#1A2E05',muted:'#4D7C0F',line:'#BEF264',tint:'#ECFCCB',reader:'#FAFFF5'},dark:{dark:true,primary:'#84CC16',bg:'#0F1A05',card:'#1A2810',ink:'#ECFCCB',muted:'#65A30D',line:'#3F6212',tint:'#1E3208',reader:'#0D1605'}}};
function themeFor(themeId:ThemeId,dark:boolean){return themePalettes[themeId]?.[dark?'dark':'light']||themePalettes.katagolap[dark?'dark':'light']}
const styles=StyleSheet.create({center:{flex:1,alignItems:'center',justifyContent:'center'},logo:{width:76,height:76,borderRadius:25,backgroundColor:'#7B1E2B',alignItems:'center',justifyContent:'center',elevation:8},brand:{fontSize:25,fontWeight:'900',marginTop:16},gate:{flex:1},art:{height:'38%',backgroundColor:'#F6E3DC',alignItems:'center',justifyContent:'center'},gateBody:{flex:1,padding:25,justifyContent:'center'},eyebrow:{fontSize:12,fontWeight:'900',letterSpacing:1},gateTitle:{fontSize:30,lineHeight:39,fontWeight:'900',marginTop:8},copy:{fontSize:14,lineHeight:22,marginVertical:14},input:{height:55,borderWidth:1,borderRadius:17,paddingHorizontal:16,fontSize:16,fontFamily:'HindSiliguriMedium'},note:{textAlign:'center',fontSize:11,marginTop:14},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:23},title:{fontSize:25,fontWeight:'900'},feature:{height:214,borderRadius:24,padding:18,flexDirection:'row',alignItems:'center',overflow:'hidden'},tag:{color:'#F7D87D',fontSize:11,fontWeight:'900',marginBottom:10},featureTitle:{color:'#fff',fontSize:23,lineHeight:30,fontWeight:'900'},featureAuthor:{color:'#F2DDD8',fontSize:12,marginTop:5},readPill:{backgroundColor:'#F5D578',borderRadius:11,padding:11,alignSelf:'flex-start',marginTop:15},cover:{width:124,height:169,borderRadius:9,padding:11,justifyContent:'flex-end',overflow:'hidden'},coverLarge:{width:137,height:188,transform:[{rotate:'2deg'}]},coverTitle:{color:'#fff',fontWeight:'900',fontSize:14,lineHeight:18},coverAuthor:{fontSize:8,color:'#FFFFFFAA'},featureCard:{height:214,borderRadius:24,padding:18,flexDirection:'row',alignItems:'center',overflow:'hidden'},featTag:{color:'#F7D87D',fontSize:11,fontWeight:'900',marginBottom:8},featTitle:{color:'#fff',fontSize:21,lineHeight:28,fontWeight:'900'},featAuthor:{color:'#F2DDD8',fontSize:12,marginTop:4},featDesc:{color:'#F2DDD8',fontSize:11,lineHeight:16,marginTop:8},featBtn:{backgroundColor:'#F5D578',borderRadius:11,paddingVertical:9,paddingHorizontal:13,alignSelf:'flex-start',marginTop:12},featBtnText:{fontWeight:'900',color:'#173D34',fontSize:12},dot:{height:6,borderRadius:3},statusBadge:{position:'absolute',top:8,left:8,alignSelf:'flex-start',borderRadius:7,paddingVertical:3,paddingHorizontal:7,backgroundColor:'#7B1E2B'},statusBadgeText:{fontSize:9,fontWeight:'900',letterSpacing:0.5,color:'#fff'},rankBadge:{position:'absolute',top:-6,left:-6,minWidth:30,height:30,borderRadius:10,alignItems:'center',justifyContent:'center',paddingHorizontal:5,borderWidth:2.5,borderColor:'#fff'},rankBadgeText:{fontSize:15,fontWeight:'900'},viewBadge:{position:'absolute',bottom:8,right:8,flexDirection:'row',alignItems:'center',gap:3,borderRadius:8,paddingVertical:3,paddingHorizontal:7,backgroundColor:'rgba(0,0,0,0.65)'},viewBadgeText:{color:'#fff',fontSize:10,fontWeight:'800'},secHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:28,marginBottom:14},secIcon:{width:28,height:28,borderRadius:14,alignItems:'center',justifyContent:'center'},seeAllPill:{borderRadius:16,paddingVertical:6,paddingHorizontal:12},section:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:28,marginBottom:14},sectionTitle:{fontSize:16,fontWeight:'900'},bookName:{fontSize:14,fontWeight:'800',lineHeight:20,marginTop:10},episode:{minHeight:98,borderRadius:18,borderWidth:1,padding:10,flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},row:{minHeight:100,borderRadius:18,borderWidth:1,padding:10,flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},rowTitle:{fontSize:14,fontWeight:'800'},tabs:{height:76,borderTopWidth:1,flexDirection:'row',paddingTop:9},tab:{flex:1,alignItems:'center',gap:4},grid2:{flexDirection:'row',flexWrap:'wrap',gap:10},link:{width:'48.4%',borderRadius:18,borderWidth:1,padding:13},linkIcon:{width:40,height:40,borderRadius:13,alignItems:'center',justifyContent:'center',marginBottom:12},catGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},catCard:{width:'47%'},catImgWrap:{borderRadius:16,overflow:'hidden',height:140},catImg:{width:'100%',height:140},catImgFallback:{width:'100%',height:140,alignItems:'center',justifyContent:'center'},catImgOverlay:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.35)',paddingVertical:8,paddingHorizontal:10},catImgName:{color:'#fff',fontSize:14,fontWeight:'700',fontFamily:'HindSiliguriMedium'},catBadge:{alignSelf:'flex-start',marginTop:8,borderRadius:8,paddingVertical:4,paddingHorizontal:10},catBadgeText:{fontSize:11,fontWeight:'700'},profile:{padding:15,borderRadius:20,borderWidth:1,flexDirection:'row',alignItems:'center',gap:12},profileName:{fontSize:18,fontWeight:'900'},group:{fontSize:11,fontWeight:'900',letterSpacing:1,marginTop:15,marginBottom:8},menu:{minHeight:61,borderBottomWidth:1,paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:11},menuIcon:{width:37,height:37,borderRadius:12,alignItems:'center',justifyContent:'center'},languageBox:{borderWidth:1,borderRadius:18,padding:15},languageRow:{height:52,borderBottomWidth:1,flexDirection:'row',alignItems:'center',gap:12},radio:{width:20,height:20,borderRadius:10,borderWidth:2,alignItems:'center',justifyContent:'center'},radioDot:{width:10,height:10,borderRadius:5},back:{height:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},backTitle:{fontSize:19,fontWeight:'900'},search:{height:53,borderWidth:1,borderRadius:17,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},notifCard:{flexDirection:'row',gap:12,borderRadius:16,borderWidth:1,padding:14,marginBottom:10},notifIconWrap:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},notifTitle:{fontSize:14,fontWeight:'800',flex:1,marginRight:8},notifBody:{fontSize:12,marginTop:4,lineHeight:18},notifTime:{fontSize:10,fontWeight:'700',marginTop:6},notifLiveDot:{width:8,height:8,borderRadius:4},notifLink:{flexDirection:'row',alignItems:'center',gap:3,borderWidth:1,borderRadius:6,paddingHorizontal:6,paddingVertical:2},badge:{position:'absolute',top:-5,right:-7,minWidth:18,height:18,borderRadius:9,alignItems:'center',justifyContent:'center',paddingHorizontal:4},badgeText:{color:'#fff',fontSize:10,fontWeight:'900'},detailTop:{height:245,borderRadius:21,alignItems:'center',justifyContent:'center',marginBottom:20},detailTitle:{fontSize:27,fontWeight:'900',lineHeight:35},meta:{flexDirection:'row',gap:17,marginTop:10},actions:{flexDirection:'row',justifyContent:'space-around',marginVertical:20},action:{width:43,height:43,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center'},button:{height:54,borderRadius:16,backgroundColor:'#7B1E2B',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:14},buttonText:{color:'#fff',fontWeight:'900',fontSize:15},chapter:{minHeight:66,borderBottomWidth:1,flexDirection:'row',alignItems:'center',gap:12},number:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},comment:{height:56,borderWidth:1,borderRadius:16,marginTop:20,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:15},readerHead:{minHeight:68,paddingHorizontal:18,borderBottomWidth:1,flexDirection:'row',alignItems:'center'},readerBody:{padding:28,paddingTop:45,paddingBottom:110},readerTitle:{fontSize:28,fontWeight:'900',textAlign:'center',marginVertical:16},readerTools:{minHeight:68,borderTopWidth:1,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},writer:{backgroundColor:'#124D43',borderRadius:20,padding:20},writerTitle:{color:'#fff',fontSize:22,fontWeight:'900',marginTop:12},story:{height:180,borderWidth:1,borderRadius:17,padding:15,textAlignVertical:'top',marginVertical:12},empty:{alignItems:'center',justifyContent:'center',paddingVertical:55},profileCard:{borderRadius:22,padding:20,alignItems:'center'},avatarBig:{width:68,height:68,borderRadius:22,alignItems:'center',justifyContent:'center'},profileNameBig:{fontSize:22,fontWeight:'900',marginTop:12},profileBadge:{fontSize:12,color:'#A08E93',marginTop:2},profileStats:{flexDirection:'row',marginTop:18,backgroundColor:'rgba(0,0,0,0.04)',borderRadius:14,paddingVertical:12},profileStat:{flex:1,alignItems:'center',gap:4},profileStatNum:{fontSize:20,fontWeight:'900'},profileStatLabel:{fontSize:10,fontWeight:'700',letterSpacing:0.5},menuGroup:{borderRadius:18,overflow:'hidden',marginBottom:10},menuGroupTitle:{fontSize:11,fontWeight:'900',letterSpacing:0.8,marginBottom:8,marginLeft:4},menuItem:{minHeight:54,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:12},menuIconBig:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},menuSep:{height:StyleSheet.hairlineWidth,marginLeft:62},nameModal:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24},nameModalBox:{width:'100%',borderRadius:22,padding:24},nameModalTitle:{fontSize:18,fontWeight:'900',marginBottom:4},nameModalHint:{fontSize:12,marginBottom:14},nameInput:{height:52,borderWidth:1.5,borderRadius:14,paddingHorizontal:16,fontSize:16,fontWeight:'700',fontFamily:'HindSiliguriMedium'},nameModalBtns:{flexDirection:'row',gap:10,marginTop:16},nameBtn:{flex:1,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},nameBtnText:{fontWeight:'900',fontSize:15},gateIcon:{width:120,height:120,borderRadius:30},gateTop:{},langRow2:{flexDirection:'row',gap:8,marginTop:18,justifyContent:'center'},langBtn2:{paddingHorizontal:18,paddingVertical:10,borderRadius:12,borderWidth:1.5}});
const featStyles=StyleSheet.create({
  card:{height:196,borderRadius:26,overflow:'hidden',backgroundColor:'#7B1E2B'},
  row:{flex:1,flexDirection:'row',alignItems:'center',gap:12,padding:14,zIndex:2},
  left:{flex:1,justifyContent:'center'},
  rank:{alignSelf:'flex-start',backgroundColor:'#C9972B',borderRadius:8,paddingHorizontal:9,paddingVertical:2},
  rankText:{color:'#4A1220',fontSize:10,fontWeight:'900'},
  pill:{alignSelf:'flex-start',borderRadius:8,paddingHorizontal:9,paddingVertical:2,backgroundColor:'#C9972B2E'},
  pillText:{color:'#EAC97A',fontSize:10,fontWeight:'900',letterSpacing:.4},
  title:{color:'#fff',fontSize:18,lineHeight:23,fontWeight:'900',marginTop:4},
  author:{color:'#EAC97A',fontSize:11,marginTop:1,fontWeight:'700'},
  meta:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:10,marginTop:4},
  metaC:{flexDirection:'row',alignItems:'center',gap:4},
  metaT:{color:'#F3E4D8',fontSize:11,fontWeight:'700'},
  btn:{flexDirection:'row',alignItems:'center',gap:6,borderRadius:12,paddingVertical:8,paddingHorizontal:14,alignSelf:'flex-start',marginTop:0,backgroundColor:'#C9972B',elevation:4,shadowColor:'#000',shadowOpacity:.3,shadowRadius:8,shadowOffset:{width:0,height:4}},
  btnText:{color:'#4A1220',fontSize:12,fontWeight:'900'},
  coverWrap:{borderRadius:13,elevation:6,shadowColor:'#000',shadowOpacity:.4,shadowRadius:12,shadowOffset:{width:0,height:6},borderWidth:1,borderColor:'#ffffff2E'},
  coverImg:{width:84,height:126,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#4A1220'},
  bm:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',borderWidth:1.5,backgroundColor:'rgba(20,5,10,0.45)'},
  bmRow:{flexDirection:'row',alignItems:'center',gap:10,marginTop:5},
  burst:{position:'absolute',top:0,left:0,width:36,height:36,borderRadius:18,borderWidth:2,borderColor:'#C9972B'},
});
