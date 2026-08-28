import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Easing, Image, KeyboardAvoidingView, PanResponder, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, Linking, View, useWindowDimensions, ActivityIndicator, Vibration } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Polyline, Ellipse, Circle, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { books as bundledBooks, categories as bundledCategories, notices as bundledNotices } from './src/data';
import { initialState, loadState, saveState, clearState } from './src/storage';
import { Book, LocalState, Language } from './src/types';
import { copy, CopyKey } from './src/i18n';
import { fetchRemoteBooks, fetchRemoteCategories, fetchRemoteNotifications, trackEvent, getOfflineBooks, getOfflineCategories, getOfflineNotices, fetchFollowedWriters, writerSignup, writerLogin, verifyWriterToken, fetchWriterStats, fetchWriterStories, createWriterStory, updateWriterProfile, followWriter, unfollowWriter, fetchWriterDashboard, fetchWriterNotifications, markWriterNotificationsRead, deleteWriterNotification, submitStoryForReview, updateWriterStory, deleteWriterStory, fetchWriterStoryDetail, createStoryChapter, deleteStoryChapter, fetchPublicWriters, fetchHomeConfig, fetchRemoteComments, submitComment, toggleBookLike, fetchHomeSections, fetchUserState, saveUserState, HomeSectionConfig, HomeSectionsData } from './src/api';
import { pickAndResizeImage } from './src/imageUpload';

type Tab = 'home'|'library'|'categories'|'episodes'|'profile';
type Screen = { type:'main' } | { type:'book', id:string } | { type:'reader', id:string, chapter:number } | { type:'search' } | { type:'notifications' } | { type:'settings' } | { type:'writer' } | { type:'list', title:string, ids:string[] } | { type:'profileDetails' } | { type:'followedWriters' } | { type:'writerProfile', writer:import('./src/types').WriterProfile } | { type:'comments', id:string };
type Theme = {dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string};
const I = (name:string) => (Feather.glyphMap as Record<string,unknown>)[name] ? name as keyof typeof Feather.glyphMap : 'bell';

export default function App(){ return <SafeAreaProvider><AppShell/></SafeAreaProvider>; }
function AppShell(){
 const [state,setState]=useState<LocalState>(initialState); const [loaded,setLoaded]=useState(false); const [screen,setScreen]=useState<Screen>({type:'main'}); const [tab,setTab]=useState<Tab>('home'); const [allBooks,setAllBooks]=useState<Book[]>(bundledBooks); const [allCategories,setAllCategories]=useState<[string,string,string,string|null][]>(bundledCategories.map(c=>[c[0],c[1],c[2],null])); const [publicWriters,setPublicWriters]=useState<import('./src/types').WriterProfile[]>([]); const [homeSections,setHomeSections]=useState<HomeSectionConfig[]>([]); const [homeData,setHomeData]=useState<HomeSectionsData|null>(null); const [remoteNotices,setRemoteNotices]=useState<{id:string;title:string;body:string;icon:string;url:string;time:string}[]>([]); const syncRef=useRef(false);
 const theme=themeFor(state.settings.themeId,state.settings.dark);
  const [dlBooks,setDlBooks]=useState<Record<string,Book>>({});
  useEffect(()=>{AsyncStorage.getItem('@lekhoni/downloads/v1').then(x=>{if(x){try{setDlBooks(JSON.parse(x))}catch{}}}).catch(()=>{})},[]);
  const persistDl=(next:Record<string,Book>)=>{setDlBooks(next);AsyncStorage.setItem('@lekhoni/downloads/v1',JSON.stringify(next)).catch(()=>{})};
  const downloadBook=(id:string)=>{const b=allBooks.find(x=>x.id===id)||bundledBooks.find(x=>x.id===id);if(!b)return;persistDl({...dlBooks,[id]:b});setState(s=>s.downloads.includes(id)?s:{...s,downloads:[...s.downloads,id]})};
  const removeDownload=(id:string)=>{const n={...dlBooks};delete n[id];persistDl(n);setState(s=>({...s,downloads:s.downloads.filter(x=>x!==id)}))};
  const resolveBook=(id:string):Book|undefined=>dlBooks[id]||allBooks.find(b=>b.id===id)||bundledBooks.find(b=>b.id===id);
  useEffect(()=>{loadState().then(async v=>{const id=v.deviceId;if(id){try{const r=await fetchUserState(id);if(r&&r.synced&&r.state){const st=r.state;const remoteSettings=st.settings&&typeof st.settings==='object'?(st.settings as any):null;v={...v,settings:remoteSettings?{...v.settings,...remoteSettings}:v.settings,history:Array.isArray(st.history)&&st.history.length?[...new Set([...(v.history||[]),...st.history])].slice(0,20):v.history,positions:st.positions&&typeof st.positions==='object'?{...v.positions,...(st.positions as any)}:v.positions,bookmarks:Array.isArray(st.bookmarks)&&st.bookmarks.length?[...new Set([...v.bookmarks,...(st.bookmarks as any[])])].slice(0,50):v.bookmarks}}}catch{}}setState(v);setLoaded(true)})},[]); useEffect(()=>{if(loaded)saveState(state)},[state,loaded]);
 useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(screen.type!=='main'){setScreen({type:'main'});return true}if(tab!=='home'){setTab('home');return true}return false});return()=>sub.remove()},[screen,tab]);
  const syncRemote=useCallback(async()=>{if(syncRef.current)return;syncRef.current=true;try{const[remote,cats,notices,writers,hcfg,hdata]=await Promise.all([fetchRemoteBooks(),fetchRemoteCategories(),fetchRemoteNotifications(),fetchPublicWriters(),fetchHomeConfig(),fetchHomeSections()]);if(remote.length){setAllBooks(remote.map(b => b.views_visible !== false && (hdata?.viewsVisible !== false) ? { ...b, views_visible: true } : { ...b, views_visible: false }));if(cats.length)setAllCategories(cats.map(c=>[c.name,c.icon,c.color,c.cover_url||null] as [string,string,string,string|null]));if(notices.length)setRemoteNotices(notices.map(n=>({id:n.id,title:n.title,body:n.body,icon:n.icon||'bell',url:n.url||'',time:n.created_at})));if(writers.length)setPublicWriters(writers);if(hcfg&&hcfg.length)setHomeSections(hcfg);if(hdata&&hdata.sections&&hdata.sections.length){setHomeData({...hdata,sections:(hdata.sections||[]).map(x=>({...x,books:(x.books||[]).map((b:any)=>({...b,views_visible:(b.views_visible!==false&&(hdata.viewsVisible!==false))}))}))});if(!writers.length&&hdata.writers&&hdata.writers.length)setPublicWriters(hdata.writers.map(w=>({id:w.id,username:w.username||w.writer_name,writer_name:w.writer_name,bio:w.bio,avatar_url:w.avatar_url,follower_count:w.follower_count,badge:w.badge||'none'})));}setState(s=>({...s,online:true,remoteBooks:remote,lastSync:new Date().toISOString()}))}else{setState(s=>({...s,online:false}))}}catch{setState(s=>({...s,online:false}))}finally{syncRef.current=false}},[]);
  useEffect(()=>{const id=setInterval(syncRemote,30000);syncRemote();return()=>clearInterval(id)},[syncRemote]);
  useEffect(()=>{if(!loaded||!state.deviceId)return;const t=setTimeout(()=>{saveUserState(state.deviceId,{settings:state.settings as any,favorites:state.favorites,downloads:state.downloads,history:state.history,positions:state.positions,bookmarks:state.bookmarks as any}).catch(()=>{})},2000);return()=>clearTimeout(t)},[loaded,state]);
 const update=(p:Partial<LocalState>)=>setState(s=>({...s,...p})); const open=(id:string)=>{update({history:[id,...state.history.filter(x=>x!==id)].slice(0,20)});setScreen({type:'book',id})}; const read=(id:string,chapter:number)=>setScreen({type:'reader',id,chapter});
 if(!loaded)return <View style={[styles.center,{backgroundColor:theme.bg}]}><Image source={require('./assets/loading-icon.png')} style={{width:120,height:120,borderRadius:30}} resizeMode="contain"/><Text style={[styles.brand,{color:theme.ink,marginTop:16,fontSize:28,fontWeight:'900',letterSpacing:1}]}>Lekhoni Kahini</Text></View>;
 if(!state.name)return <NameGate theme={theme} lang={state.settings.language} onDone={(name,lang)=>{update({name,settings:{...state.settings,language:lang}})}}/>;
  const common={theme,state,update,setScreen,open,read,allBooks,allCategories,publicWriters,homeSections,homeData,remoteNotices,dlBooks,downloadBook,removeDownload}; let body:React.ReactNode;
 if(screen.type==='main')body=<Main {...common} tab={tab} setTab={setTab}/>;
 if(screen.type==='book')body=<Details {...common} book={resolveBook(screen.id)!}/>;
 if(screen.type==='reader')body=<Reader {...common} book={resolveBook(screen.id)!} chapter={screen.chapter}/>;
 if(screen.type==='search')body=<Search {...common}/>; if(screen.type==='notifications')body=<Notifications {...common}/>; if(screen.type==='settings')body=<Settings {...common}/>; if(screen.type==='writer')body=<Writer {...common}/>;
   if(screen.type==='list')body=<BookList {...common} title={screen.title} ids={screen.ids}/>;
   if(screen.type==='comments')body=<Comments {...common} bookId={screen.id}/>;
  if(screen.type==='profileDetails')body=<ProfileDetails {...common}/>;
  if(screen.type==='followedWriters')body=<FollowedWritersList {...common}/>;
  if(screen.type==='writerProfile')body=<WriterProfileView {...common} writer={screen.writer}/>;
 return <View style={{flex:1,backgroundColor:theme.bg}}><StatusBar style={state.settings.dark?'light':'dark'}/>{body}</View>;
}
type C={theme:Theme;state:LocalState;update:(p:Partial<LocalState>)=>void;setScreen:(s:Screen)=>void;open:(id:string)=>void;read:(id:string,c:number)=>void;allBooks:Book[];allCategories:[string,string,string,string|null][];publicWriters:import('./src/types').WriterProfile[];homeSections:HomeSectionConfig[];homeData:HomeSectionsData|null;remoteNotices:{id:string;title:string;body:string;icon:string;url:string;time:string}[];dlBooks:Record<string,Book>;downloadBook:(id:string)=>void;removeDownload:(id:string)=>void};
const tr=(p:C,key:CopyKey)=>copy(p.state.settings.language,key);
function greet(p:C){const h=new Date().getHours();const key=h<12?'morning':h<17?'afternoon':h<21?'evening':'night';return tr(p,key as CopyKey);}
function Page({children,theme}:{children:React.ReactNode;theme:Theme}){const insets=useSafeAreaInsets();return <ScrollView style={{flex:1,backgroundColor:theme.bg}} contentContainerStyle={{paddingTop:insets.top+12,paddingHorizontal:18,paddingBottom:110}} showsVerticalScrollIndicator={false}>{children}</ScrollView>}
function NameGate({theme,lang,onDone}:{theme:Theme;lang:import('./src/types').Language;onDone:(n:string,l:import('./src/types').Language)=>void}){const[name,setName]=useState('');const[curLang,setCurLang]=useState<import('./src/types').Language>(lang);const langs:[import('./src/types').Language,string][]=[['bn','বাংলা'],['en','English'],['hi','हिन्दी']];const{height}=useWindowDimensions();return <KeyboardAvoidingView style={{flex:1,backgroundColor:theme.bg}} behavior={Platform.OS==='ios'?'padding':'height'}><ScrollView contentContainerStyle={{paddingHorizontal:25,paddingTop:80,paddingBottom:40}} keyboardShouldPersistTaps="handled"><View style={{alignItems:'center',marginBottom:10}}><Image source={require('./assets/adaptive-icon.png')} style={[styles.gateIcon]} resizeMode="contain"/></View><Text style={[styles.eyebrow,{color:theme.primary,textAlign:'center'}]}>{copy(curLang,'welcome')}</Text><Text style={[styles.gateTitle,{color:theme.ink,textAlign:'center'}]}>{copy(curLang,'nameQuestion')}</Text><Text style={[styles.copy,{color:theme.muted,textAlign:'center'}]}>{copy(curLang,'gateHint')}</Text><TextInput autoFocus value={name} onChangeText={setName} placeholder={copy(curLang,'namePlaceholder')} placeholderTextColor={theme.muted} style={[styles.input,{color:theme.ink,backgroundColor:theme.card,borderColor:theme.line}]}/><Button title={copy(curLang,'startBtn')} icon="arrow-right" disabled={!name.trim()} onPress={()=>onDone(name.trim(),curLang)}/><Text style={[styles.note,{color:theme.muted}]}>{copy(curLang,'nameNote')}</Text><View style={styles.langRow2}>{langs.map(([code,label])=><Pressable key={code} onPress={()=>setCurLang(code)} style={[styles.langBtn2,{backgroundColor:curLang===code?theme.primary:theme.card,borderColor:curLang===code?theme.primary:theme.line}]}><Text style={{color:curLang===code?'#fff':theme.ink,fontWeight:'800',fontSize:13}}>{label}</Text></Pressable>)}</View></ScrollView></KeyboardAvoidingView>}
function Main(p:C&{tab:Tab;setTab:(t:Tab)=>void}){
 const {width:screenW}=useWindowDimensions();
 const {theme,tab,setTab}=p;
 const prevTab=React.useRef(tab);
 const content=tab==='home'?<Home {...p}/>:tab==='library'?<Library {...p}/>:tab==='categories'?<Categories {...p}/>:tab==='episodes'?<Episodes {...p}/>:<Profile {...p}/>;
 const tabs:[Tab,string,CopyKey][]=[['home','home','home'],['library','book-open','library'],['categories','grid','categories'],['episodes','layers','episodes'],['profile','menu','menu']];
 const tabIdx=tabs.findIndex(x=>x[0]===tab);
 const slideAnim=React.useRef(new Animated.Value(tabIdx)).current;
 React.useEffect(()=>{Animated.timing(slideAnim,{toValue:tabIdx,duration:170,easing:Easing.bezier(0.25,0.1,0.25,1),useNativeDriver:false}).start();prevTab.current=tab},[tabIdx]);
 const navW=screenW-40;
 const itemW=(navW-12)/tabs.length;
 return <View style={{flex:1}}>{content}<View style={{position:'absolute',bottom:24,left:20,right:20,backgroundColor:theme.card,borderRadius:24,flexDirection:'row',paddingVertical:10,paddingHorizontal:6,shadowColor:'#000',shadowOpacity:0.08,shadowRadius:20,shadowOffset:{width:0,height:8},elevation:8,borderWidth:1,borderColor:theme.line,overflow:'hidden'}}><Animated.View style={{position:'absolute',top:10,bottom:10,left:6,width:itemW,backgroundColor:theme.tint,borderRadius:16,transform:[{translateX:slideAnim.interpolate({inputRange:[0,1,2,3,4],outputRange:[0,itemW,itemW*2,itemW*3,itemW*4]})}]}}/>{tabs.map((x,i)=><Pressable key={x[0]} onPress={()=>setTab(x[0])} style={{flex:1,alignItems:'center',gap:4,paddingVertical:6,zIndex:1}}><Feather name={I(x[1])} size={20} color={tab===x[0]?theme.primary:theme.muted}/><Text allowFontScaling={false} numberOfLines={1} style={{fontSize:9,fontWeight:'800',color:tab===x[0]?theme.primary:theme.muted}}>{tr(p,x[2])}</Text></Pressable>)}</View></View>
}
function Header({title,sub,theme,action,onNotif,unreadCount}:{title:string;sub?:string;theme:Theme;action?:React.ReactNode;onNotif?:()=>void;unreadCount?:number}){return <View style={styles.header}><View style={{flex:1,marginRight:12}}><Text numberOfLines={1} style={[styles.title,{color:theme.ink}]}>{title}</Text>{sub&&<Text numberOfLines={1} style={{color:theme.muted,marginTop:4}}>{sub}</Text>}</View><View style={{flexDirection:'row',alignItems:'center',gap:18}}>{action}<Pressable onPress={()=>onNotif?onNotif():null} style={{position:'relative'}}><Feather name="bell" size={20} color={theme.ink}/>{!!unreadCount&&<View style={[styles.badge,{backgroundColor:'#EF4444'}]}><Text style={styles.badgeText}>{unreadCount}</Text></View>}</Pressable></View></View>}
function Home(p:C){const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;const books=p.allBooks;const byViews=(a:Book,b:Book)=>+b.views-(+a.views);const G='#2AA876',AU='#D9A407',BL='#3B82F6',PU='#8B5CF6';const order=['featured','newEpisodes','mostPopular','weeklyPopular','monthlyPopular','popularAuthors'];const cfg=(p.homeSections.length?p.homeSections:order.map(k=>({key:k,enabled:true}))).filter(c=>c.enabled).map(c=>c.key);const toBook=(b:any):Book=>({id:b.id,title:b.title,author:b.author,views:`${b.views}`,rating:4.5,color:b.color,accent:b.accent,category:b.category||'',categoryIcon:'book-open',description:b.description||'',updated:'',chapters:[],isNew:Boolean(b.is_new),featured:Boolean(b.featured),views_visible: b.views_visible !== false,cover_url:b.cover_url||null});const hd=p.homeData;const hlist=(k:string):Book[]=>{if(hd){const s=hd.sections.find(x=>x.key===k);if(s&&s.books&&s.books.length)return s.books.slice(0,12).map((b:any)=>toBook(b) as Book).filter((b:any)=>b&&b.id);}return[];};const htitle=(k:string)=>hd?(hd.sections.find(x=>x.key===k)?.title||''):'';const section=(title:string,icon:string,accent:string,list:Book[],rank?:boolean)=><View><View style={styles.secHead}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={[styles.secIcon,{backgroundColor:accent+'22'}]}><Feather name={I(icon)} size={14} color={accent}/></View><Text style={[styles.sectionTitle,{color:p.theme.ink}]}>{title}</Text></View><Pressable onPress={()=>p.setScreen({type:'list',title,ids:list.map(x=>x.id)})} style={[styles.seeAllPill,{backgroundColor:accent+'1A'}]}><Text style={{color:accent,fontWeight:'800',fontSize:12}}>{tr(p,'seeAllText')}</Text></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{list.map((b,i)=><BookCard key={b.id} book={b} theme={p.theme} lang={p.state.settings.language} accent={accent} rank={rank?i:undefined} onPress={()=>p.open(b.id)}/>)}</ScrollView></View>;const authors=()=>p.publicWriters.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{p.publicWriters.map(w=><AuthorCard key={w.id} writer={w} theme={p.theme} lang={p.state.settings.language} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} bookCount={p.allBooks.filter(b=>b.author===w.writer_name).length}/>)}</ScrollView>:<Empty theme={p.theme}/>;const content=(k:string)=>{if(k==='featured'){const fl=hlist('featured');return <Featured {...p} list={fl}/>;}if(k==='popularAuthors')return <View><View style={styles.secHead}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={[styles.secIcon,{backgroundColor:'#EC4899'+'22'}]}><Feather name="users" size={14} color="#EC4899"/></View><Text style={[styles.sectionTitle,{color:p.theme.ink}]}>{htitle('popularAuthors')||tr(p,'popularAuthors')}</Text></View></View>{authors()}</View>;if(k==='newEpisodes'){const l=hlist('newEpisodes');return section(htitle('newEpisodes')||tr(p,'newEpisodes'),'zap',G,l.length?l:books);}if(k==='weeklyPopular'){const l=hlist('weeklyPopular');return section(htitle('weeklyPopular')||tr(p,'weeklyPopular'),'calendar',BL,l.length?l:[...books].sort(byViews),true);}if(k==='monthlyPopular'){const l=hlist('monthlyPopular');return section(htitle('monthlyPopular')||tr(p,'monthlyPopular'),'star',PU,l.length?l:[...books].sort(byViews),true);}if(k==='mostPopular'){const l=hlist('mostPopular');return section(htitle('mostPopular')||tr(p,'mostPopular'),'trending-up',AU,l.length?l:[...books].sort(byViews),true);}return null;};return <Page theme={p.theme}><Header title={`${greet(p)}, ${p.state.name}`} sub={tr(p,'choose')} theme={p.theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un} action={<Pressable onPress={()=>p.setScreen({type:'search'})}><Feather name="search" size={21} color={p.theme.ink}/></Pressable>}/>{cfg.map(k=><React.Fragment key={k}>{content(k)}</React.Fragment>)}</Page>}
function LibraryLink({title,icon,n,theme,onPress}:{title:string;icon:string;n:number;theme:Theme;onPress:()=>void}){const scale=React.useRef(new Animated.Value(1)).current;const pressIn=()=>{Animated.spring(scale,{toValue:0.96,useNativeDriver:true}).start()};const pressOut=()=>{Animated.spring(scale,{toValue:1,friction:3,tension:40,useNativeDriver:true}).start()};return <Animated.View style={{transform:[{scale}],width:'48.5%'}}><Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={{backgroundColor:theme.card,borderRadius:20,borderWidth:1,borderColor:theme.line,paddingVertical:20,paddingHorizontal:16,shadowColor:'#000',shadowOpacity:0.04,shadowRadius:10,shadowOffset:{width:0,height:2},elevation:2}}><View style={{width:44,height:44,borderRadius:14,backgroundColor:theme.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}><Feather name={I(icon)} size={20} color={theme.primary}/></View><Text style={{fontSize:14,fontWeight:'800',color:theme.ink,marginBottom:4}}>{title}</Text><Text style={{color:theme.muted,fontSize:11,fontWeight:'600'}}>{n}টি</Text></Pressable></Animated.View>}
function LibBookCard({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={{backgroundColor:theme.card,borderRadius:18,borderWidth:1,borderColor:theme.line,flexDirection:'row',alignItems:'center',padding:12,marginBottom:12,shadowColor:'#000',shadowOpacity:0.03,shadowRadius:8,shadowOffset:{width:0,height:2},elevation:2,gap:14}}><View style={{width:72,height:96,borderRadius:12,backgroundColor:book.color,overflow:'hidden',justifyContent:'flex-end',padding:8}}>{book.cover_url?<><Image source={{uri:book.cover_url}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:12}} resizeMode="cover"/><View style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:12,backgroundColor:'rgba(0,0,0,0.15)'}}/></>:null}<Text numberOfLines={2} style={{color:'#fff',fontWeight:'900',fontSize:10,lineHeight:13}}>{book.title}</Text></View><View style={{flex:1}}><Text numberOfLines={2} style={{fontSize:15,fontWeight:'800',color:theme.ink,lineHeight:20}}>{book.title}</Text><Text numberOfLines={1} style={{fontSize:12,fontWeight:'600',color:theme.primary,marginTop:5}}>{book.author}</Text><View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:8}}><View style={{flexDirection:'row',alignItems:'center',gap:3}}><Feather name="eye" size={11} color={theme.muted}/><Text style={{color:theme.muted,fontSize:11}}>{book.views_visible !== false ? book.views : ''}</Text></View><View style={{width:3,height:3,borderRadius:1.5,backgroundColor:theme.muted,opacity:0.4}}/><Text style={{color:theme.muted,fontSize:11}}>{book.category}</Text></View></View><Feather name="chevron-right" size={18} color={theme.muted} style={{opacity:0.5}}/></Pressable>}
function Library(p:C){const[libTab,setLibTab]=React.useState<'downloads'|'favorites'|'history'|'bookmarks'>('downloads');const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;const theme=p.theme;const tabs:{key:'downloads'|'favorites'|'history'|'bookmarks';icon:string;label:string}[]=[{key:'downloads',icon:'download-cloud',label:tr(p,'downloads')},{key:'favorites',icon:'heart',label:tr(p,'favorites')},{key:'history',icon:'clock',label:tr(p,'history')},{key:'bookmarks',icon:'bookmark',label:tr(p,'bookmarks')}];const tabIdx=tabs.findIndex(x=>x.key===libTab);const slideAnim=React.useRef(new Animated.Value(tabIdx)).current;React.useEffect(()=>{Animated.timing(slideAnim,{toValue:tabIdx,duration:170,easing:Easing.bezier(0.25,0.1,0.25,1),useNativeDriver:true}).start()},[tabIdx]);const{width:sw}=useWindowDimensions();const pad=18;const contW=sw-pad*2;const inner=contW-8;const tabW=inner/4;const ids=libTab==='downloads'?p.state.downloads:libTab==='favorites'?p.state.favorites:libTab==='history'?p.state.history:p.state.bookmarks;return <Page theme={theme}><Header title={tr(p,'library')} sub={tr(p,'librarySub')} theme={theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/><View style={{backgroundColor:theme.card,borderRadius:16,borderWidth:1,borderColor:theme.line,marginBottom:24,shadowColor:'#000',shadowOpacity:0.03,shadowRadius:6,shadowOffset:{width:0,height:2},elevation:2,overflow:'hidden',flexDirection:'row',padding:4}}><Animated.View style={{position:'absolute',top:4,bottom:4,left:4,width:tabW,backgroundColor:theme.tint,borderRadius:12,transform:[{translateX:slideAnim.interpolate({inputRange:[0,1,2,3],outputRange:[0,tabW+4,tabW*2+8,tabW*3+12]})}]}}/>{tabs.map((t,i)=><Pressable key={t.key} onPress={()=>setLibTab(t.key)} style={{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:14,zIndex:1}}><Feather name={I(t.icon)} size={18} color={libTab===t.key?theme.primary:theme.muted}/>{libTab===t.key&&<Text style={{fontSize:10,fontWeight:'800',color:theme.primary,marginTop:3}} numberOfLines={1}>{t.label}</Text>}</Pressable>)}</View><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><Text style={{fontSize:17,fontWeight:'900',color:theme.ink}}>{tabs[tabIdx].label}</Text><View style={{backgroundColor:theme.tint,borderRadius:8,paddingHorizontal:10,paddingVertical:4}}><Text style={{color:theme.primary,fontSize:11,fontWeight:'700'}}>{ids.length}টি</Text></View></View>{ids.length?ids.map(id=>{const b=p.allBooks.find(x=>x.id===id);return b&&<LibBookCard key={id} book={b} theme={theme} onPress={()=>p.open(id)}/> }):<Empty theme={theme}/>}</Page>}
function Categories(p:C){const theme=p.theme;const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;return <Page theme={theme}><Header title={tr(p,'categories')} sub={tr(p,'categoriesSub')} theme={theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/><View style={styles.catGrid}>{p.allCategories.map(c=>{const count=p.allBooks.filter(b=>b.category===c[0]).length;const hasImg=Boolean(c[3]);const bookWord=count===1?'book':tr(p,'books');return <Pressable key={c[0]} onPress={()=>p.setScreen({type:'list',title:c[0],ids:p.allBooks.filter(b=>b.category===c[0]).map(b=>b.id)})} style={styles.catCard}><View style={[styles.catImgWrap]}>{hasImg?<Image source={{uri:c[3]!}} style={styles.catImg}/>:<View style={[styles.catImgFallback,{backgroundColor:c[2]}]}><Text style={{color:'#fff',fontSize:28,fontWeight:'900',opacity:0.5}}>{c[0][0]}</Text></View>}<View style={styles.catImgOverlay}><Text numberOfLines={1} style={styles.catImgName}>{c[0]}</Text></View></View><View style={[styles.catBadge,{backgroundColor:theme.tint}]}><Text style={[styles.catBadgeText,{color:theme.primary}]}>{count} {bookWord}</Text></View></Pressable>})}</View></Page>}
function Episodes(p:C){const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;return <Page theme={p.theme}><Header title={tr(p,'episodes')} sub={tr(p,'episodesSub')} theme={p.theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/>{p.allBooks.map((b,i)=><Episode key={b.id} book={b} theme={p.theme} onPress={()=>p.read(b.id,(i+2)%b.chapters.length)}/>)}</Page>}
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
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Text style={{fontSize:18,fontWeight:'900',color:t.primary}}>{p.state.name[0]?.toUpperCase()||'?'}</Text>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <Text numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{p.state.name}</Text>
        <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{tr(p,'regularReader')}</Text>
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
          <Text style={{fontSize:13,fontWeight:'800',color:t.ink}}>{tr(p,'readingStreak')}</Text>
          <Text style={{fontSize:10,color:t.muted,marginTop:1}}>{tr(p,'keepItUp')}</Text>
        </View>
        <View style={{alignItems:'center',backgroundColor:t.card,borderRadius:10,paddingHorizontal:10,paddingVertical:5,borderWidth:1,borderColor:t.line}}>
          <Animated.Text style={{fontSize:20,fontWeight:'900',color:t.primary}}>{counterDisplay}</Animated.Text>
          <Text style={{fontSize:8,fontWeight:'800',color:t.muted,marginTop:-2}}>{tr(p,'days')}</Text>
        </View>
      </View>
      <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:10,paddingHorizontal:2}}>
        {[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const active=Boolean(p.state.readingActivity[k]?.episodes);const today=new Date().toISOString().slice(0,10);const isToday=k===today;return <Animated.View key={i} style={{alignItems:'center',gap:4,transform:[{scale:streakDots[i]}]}}>
          <View style={{width:24,height:24,borderRadius:12,backgroundColor:active?t.primary:isToday?t.card:`${t.primary}11`,alignItems:'center',justifyContent:'center',borderWidth:isToday?2:0,borderColor:isToday?t.primary:'transparent'}}>
            {active?<Feather name="check" size={10} color="#fff"/>:isToday&&<View style={{width:5,height:5,borderRadius:3,backgroundColor:t.primary}}/>}
          </View>
          <Text style={{fontSize:8,fontWeight:isToday?'800':'600',color:isToday?t.ink:t.muted}}>{dayLabels[i]}</Text>
        </Animated.View>})}
      </View>
    </Animated.View>

    {/* === WEEKLY READING CARD — compact analytics === */}
    <Animated.View style={{opacity:cardFade2,transform:[{translateY:cardFade2.interpolate({inputRange:[0,1],outputRange:[10,0]})}],backgroundColor:t.card,borderRadius:12,paddingHorizontal:12,paddingTop:10,paddingBottom:10,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
        <Feather name="bar-chart-2" size={12} color={t.primary}/>
        <Text style={{fontSize:11,fontWeight:'800',color:t.ink,marginLeft:6}}>{tr(p,'yourReading')}</Text>
        <Text style={{fontSize:9,color:t.muted,marginLeft:'auto'}}>{tr(p,'weekSummary')}</Text>
      </View>
      <View style={{flexDirection:'row',gap:6,marginBottom:8}}>
        <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:`${t.primary}08`,borderRadius:8,paddingHorizontal:10,paddingVertical:6}}>
          <Feather name="clock" size={12} color={t.primary}/>
          <View>
            <Text style={{fontSize:15,fontWeight:'900',color:t.primary,lineHeight:17}}>{weekMins}</Text>
            <Text style={{fontSize:8,fontWeight:'600',color:t.muted}}>{tr(p,'minRead')}</Text>
          </View>
        </View>
        <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:`${t.primary}08`,borderRadius:8,paddingHorizontal:10,paddingVertical:6}}>
          <Feather name="book-open" size={12} color={t.primary}/>
          <View>
            <Text style={{fontSize:15,fontWeight:'900',color:t.primary,lineHeight:17}}>{weekEps}</Text>
            <Text style={{fontSize:8,fontWeight:'600',color:t.muted}}>{tr(p,'episodesDone')}</Text>
          </View>
        </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',height:30,paddingHorizontal:1}}>
        {[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const m=p.state.readingActivity[k]?.minutes||0;const h=Math.max(2,Math.round(m/maxBar*24));const today=new Date().toISOString().slice(0,10);const isToday=k===today;return <Animated.View key={i} style={{alignItems:'center',flex:1,justifyContent:'flex-end',gap:2,transform:[{scaleY:weekBars[i]}]}}>
          <View style={{width:'55%',height:h,backgroundColor:m?t.primary:isToday?`${t.primary}15`:`${t.primary}08`,borderRadius:2,minHeight:2}}/>
          <Text style={{fontSize:7,fontWeight:isToday?'800':'500',color:isToday?t.primary:t.muted}}>{dayLabels[i]}</Text>
        </Animated.View>})}
      </View>
    </Animated.View>

    <Pressable onPress={()=>p.setScreen({type:'writer'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
      {p.state.writer?.avatar_url?<Image source={{uri:p.state.writer.avatar_url}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:p.state.writer?t.primary:t.tint,alignItems:'center',justifyContent:'center'}}>
        {p.state.writer?<Text style={{fontSize:18,fontWeight:'900',color:'#fff'}}>{p.state.writer.writer_name[0]?.toUpperCase()||'?'}</Text>:<Feather name="edit-3" size={18} color={t.primary}/>}
      </View>}
      <View style={{flex:1,marginLeft:12}}>
        <Text numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{p.state.writer?p.state.writer.writer_name:tr(p,'writer')}</Text>
        <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.writer?tr(p,'writerStudio'):tr(p,'writerStudioSub')}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Pressable onPress={()=>p.setScreen({type:'followedWriters'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="users" size={18} color={t.primary}/>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <Text numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{tr(p,'followedWriters')}</Text>
        <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.followedWriters.length} {tr(p,'writers')}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Pressable onPress={()=>p.setScreen({type:'settings'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="settings" size={18} color={t.primary}/>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <Text numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{tr(p,'settings')}</Text>
        <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{tr(p,'theme')}, {tr(p,'language')}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Text style={[styles.menuGroupTitle,{color:t.muted}]}>{tr(p,'aboutApp')}</Text>
    <View style={[styles.menuGroup,{backgroundColor:t.card}]}>
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
  const favs=p.state.favorites.length;
  const downs=p.state.downloads.length;
  const hist=p.state.history.length;
  const favBooks=p.state.favorites.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const downBooks=p.state.downloads.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const histBooks=p.state.history.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const [editing,setEditing]=useState(false);
  const [nameInput,setNameInput]=useState(p.state.name);

  const sections:{title:string;icon:string;count:number;books:Book[];ids:string[]}[]=[
    {title:tr(p,'favorites'),icon:'heart',count:favs,books:favBooks,ids:p.state.favorites},
    {title:tr(p,'downloads'),icon:'download',count:downs,books:downBooks,ids:p.state.downloads},
    {title:tr(p,'history'),icon:'clock',count:hist,books:histBooks,ids:p.state.history},
  ];

  return <Page theme={t}>
    <Back title={tr(p,'guestReader')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[styles.profileCard,{backgroundColor:t.card}]}>
        <View style={[styles.avatarBig,{backgroundColor:t.tint}]}><Text style={{fontSize:28,fontWeight:'900',color:t.primary}}>{p.state.name[0]?.toUpperCase()||'?'}</Text></View>
        <Text style={[styles.profileNameBig,{color:t.ink}]}>{p.state.name}</Text>
        <Text style={[styles.profileBadge,{color:t.muted}]}>{tr(p,'regularReader')}</Text>
        <View style={[styles.profileStats,{backgroundColor:t.bg}]}>
          <View style={styles.profileStat}><Text style={[styles.profileStatNum,{color:t.primary}]}>{favs}</Text><Text style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'favorites')}</Text></View>
          <View style={[styles.profileStat,{borderLeftWidth:1,borderLeftColor:t.line}]}><Text style={[styles.profileStatNum,{color:t.primary}]}>{downs}</Text><Text style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'downloads')}</Text></View>
          <View style={[styles.profileStat,{borderLeftWidth:1,borderLeftColor:t.line}]}><Text style={[styles.profileStatNum,{color:t.primary}]}>{hist}</Text><Text style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'history')}</Text></View>
        </View>
        <Pressable onPress={()=>{setNameInput(p.state.name);setEditing(true)}} style={{marginTop:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:t.tint,borderRadius:12,paddingHorizontal:14,paddingVertical:8}}>
          <Feather name="edit-2" size={14} color={t.primary}/><Text style={{color:t.primary,fontWeight:'800',fontSize:13}}>{tr(p,'editName')}</Text>
        </Pressable>
      </View>

      {sections.map((sec,idx)=><Pressable key={idx} onPress={()=>{if(sec.ids.length)p.setScreen({type:'list',title:sec.title,ids:sec.ids})}} style={[styles.menuGroup,{backgroundColor:t.card,marginBottom:10}]}>
        <View style={{flexDirection:'row',alignItems:'center',paddingVertical:14,paddingHorizontal:16}}>
          <View style={{width:36,height:36,borderRadius:10,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
            <Feather name={sec.icon as any} size={17} color={t.primary}/>
          </View>
          <View style={{flex:1,marginLeft:12}}>
            <Text style={{fontSize:14,fontWeight:'800',color:t.ink}}>{sec.title}</Text>
            <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{sec.count} {tr(p,'books')}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={t.muted}/>
        </View>
      </Pressable>)}
    </ScrollView>

    {editing&&<Pressable onPress={()=>setEditing(false)} style={styles.nameModal}><Pressable onPress={()=>{}} style={[styles.nameModalBox,{backgroundColor:t.card}]}><Text style={[styles.nameModalTitle,{color:t.ink}]}>{tr(p,'editName')}</Text><Text style={[styles.nameModalHint,{color:t.muted}]}>{tr(p,'editNameHint')}</Text><TextInput autoFocus value={nameInput} onChangeText={v=>setNameInput(v.slice(0,20))} placeholder={tr(p,'regularReader')} placeholderTextColor={t.muted} style={[styles.nameInput,{color:t.ink,backgroundColor:t.bg,borderColor:t.line}]}/><View style={styles.nameModalBtns}><Pressable onPress={()=>setEditing(false)} style={[styles.nameBtn,{backgroundColor:t.bg}]}><Text style={{color:t.muted,fontWeight:'900'}}>{tr(p,'cancel')}</Text></Pressable><Pressable onPress={()=>{if(nameInput.trim()){p.update({name:nameInput.trim()});setEditing(false)}}} style={[styles.nameBtn,{backgroundColor:t.primary}]}><Text style={{color:'#fff',fontWeight:'900'}}>{tr(p,'save')}</Text></Pressable></View></Pressable></Pressable>}
  </Page>}

function FollowedWritersList(p:C){
  const t=p.theme;
  const writers=p.state.followedWriters;
  const toggleFollow=(wid:string)=>{
    const isFollowed=p.state.followedWriters.some(w=>w.id===wid);
    if(isFollowed){
      unfollowWriter(p.state.deviceId,wid);
      p.update({followedWriters:p.state.followedWriters.filter(w=>w.id!==wid)});
    }else{
      const w=writers.find(x=>x.id===wid);
      if(w)followWriter(p.state.deviceId,wid);
    }
  };
  return <Page theme={t}>
    <Back title={tr(p,'followedWriters')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    {writers.length===0?
      <View style={{alignItems:'center',paddingVertical:60}}>
        <View style={{width:60,height:60,borderRadius:30,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}>
          <Feather name="users" size={26} color={t.muted}/>
        </View>
        <Text style={{fontSize:14,fontWeight:'700',color:t.muted,textAlign:'center'}}>{tr(p,'noFollowedWriters')}</Text>
      </View>
    :<ScrollView showsVerticalScrollIndicator={false}>
      {writers.map(w=><Pressable key={w.id} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
        <View style={{width:44,height:44,borderRadius:22,backgroundColor:t.primary,alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:18,fontWeight:'900',color:'#fff'}}>{w.writer_name[0]?.toUpperCase()||'?'}</Text>
        </View>
        <View style={{flex:1,marginLeft:12}}>
          <Text numberOfLines={1} style={{fontSize:14,fontWeight:'800',color:t.ink}}>{w.writer_name} <BadgeIcon badge={w.badge} size={14}/></Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>@{w.username}{w.follower_count?` · ${w.follower_count} ${tr(p,'followers')}`:''}</Text>
        </View>
        <Pressable onPress={()=>toggleFollow(w.id)} style={{paddingHorizontal:14,paddingVertical:7,borderRadius:10,backgroundColor:t.tint}}>
          <Text style={{fontSize:12,fontWeight:'800',color:t.primary}}>{tr(p,'unfollow')}</Text>
        </Pressable>
      </Pressable>)}
    </ScrollView>}
  </Page>}

function WriterProfileView(p:C&{writer:import('./src/types').WriterProfile}){
  const t=p.theme;const w=p.writer;
  const isFollowed=p.state.followedWriters.some(x=>x.id===w.id);
  const writerBooks=p.allBooks.filter(b=>b.author===w.writer_name);
  const published=writerBooks.length;
  const totalReads=writerBooks.reduce((s,b)=>s+(Math.round(parseFloat(String(b.views).replace(/[^0-9.]/g,''))||0)),0);
  const followers=w.follower_count||0;
  const[phase,setPhase]=useState<'idle'|'spinning'|'followed'>(isFollowed?'followed':'idle');
  const spin=useRef(new Animated.Value(0)).current;
  useEffect(()=>{setPhase(isFollowed?'followed':'idle')},[isFollowed]);
  const doFollow=()=>{
    setPhase('spinning');
    spin.setValue(0);
    Animated.timing(spin,{toValue:1,duration:1500,easing:Easing.linear,useNativeDriver:true}).start();
    followWriter(p.state.deviceId,w.id);
    p.update({followedWriters:[...p.state.followedWriters,w]});
    setTimeout(()=>{spin.stopAnimation();spin.setValue(0);setPhase('followed')},1800);
  };
  const doUnfollow=()=>{
    unfollowWriter(p.state.deviceId,w.id);
    p.update({followedWriters:p.state.followedWriters.filter(x=>x.id!==w.id)});
    setPhase('idle');
  };
  const spinDeg=spin.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  return <Page theme={t}>
    <Back title={tr(p,'writer')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:30}}>
      <View style={{alignItems:'center',paddingTop:10,marginBottom:20}}>
        {w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:100,height:100,borderRadius:24,backgroundColor:t.tint}}/>:<View style={{width:100,height:100,borderRadius:24,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:40,fontWeight:'900',color:t.primary}}>{w.writer_name[0]?.toUpperCase()||'?'}</Text></View>}
        <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
          <Text style={{fontSize:22,fontWeight:'900',color:t.ink}}>{w.writer_name}</Text>
          <BadgeIcon badge={w.badge} size={22}/>
        </View>
        <Text style={{fontSize:13,fontWeight:'500',color:t.muted,marginTop:3}}>@{w.username}</Text>
        {w.bio&&<Text style={{fontSize:13,color:t.muted,marginTop:8,textAlign:'center',lineHeight:20,maxWidth:300}}>{w.bio}</Text>}
      </View>
      <View style={{flexDirection:'row',marginHorizontal:16,marginBottom:16}}>
        <View style={{flex:1,alignItems:'center',paddingVertical:14,backgroundColor:t.card,borderRadius:14,borderWidth:1,borderColor:t.line}}>
          <Text style={{fontSize:20,fontWeight:'900',color:t.primary}}>{published}</Text>
          <Text style={{fontSize:11,fontWeight:'700',color:t.muted,marginTop:2}}>{tr(p,'publishedCount')}</Text>
        </View>
        <View style={{width:8}}/>
        <View style={{flex:1,alignItems:'center',paddingVertical:14,backgroundColor:t.card,borderRadius:14,borderWidth:1,borderColor:t.line}}>
          <Text style={{fontSize:20,fontWeight:'900',color:t.primary}}>{totalReads}</Text>
          <Text style={{fontSize:11,fontWeight:'700',color:t.muted,marginTop:2}}>{tr(p,'totalReads')}</Text>
        </View>
        <View style={{width:8}}/>
        <View style={{flex:1,alignItems:'center',paddingVertical:14,backgroundColor:t.card,borderRadius:14,borderWidth:1,borderColor:t.line}}>
          <Text style={{fontSize:20,fontWeight:'900',color:t.primary}}>{followers}</Text>
          <Text style={{fontSize:11,fontWeight:'700',color:t.muted,marginTop:2}}>{tr(p,'followers')}</Text>
        </View>
      </View>
      {phase==='spinning'?<View style={{marginHorizontal:16,height:48,borderRadius:14,backgroundColor:t.tint,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginBottom:6}}>
        <Animated.View style={{transform:[{rotate:spinDeg}]}}><Feather name="loader" size={16} color={t.primary}/></Animated.View>
        <Text style={{fontSize:14,fontWeight:'800',color:t.primary}}>{tr(p,'follow')}</Text>
      </View>:<Pressable onPress={phase==='followed'?doUnfollow:doFollow} style={{marginHorizontal:16,height:48,borderRadius:14,backgroundColor:phase==='followed'?t.bg:t.primary,borderWidth:phase==='followed'?1.5:0,borderColor:t.line,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginBottom:6}}>
        <Feather name={phase==='followed'?'user-check':'user-plus'} size={16} color={phase==='followed'?t.ink:'#fff'}/>
        <Text style={{fontSize:14,fontWeight:'800',color:phase==='followed'?t.ink:'#fff'}}>{phase==='followed'?'ফলো করছেন':tr(p,'follow')}</Text>
      </Pressable>}
      <Text style={{fontSize:11,color:t.muted,textAlign:'center',marginBottom:20,lineHeight:17,paddingHorizontal:28}}>{tr(p,'followHint')}</Text>
      {writerBooks.length>0&&<>
        <View style={{flexDirection:'row',alignItems:'center',marginHorizontal:16,marginBottom:12}}>
          <Text style={{fontSize:16,fontWeight:'900',color:t.ink,flex:1}}>{tr(p,'storiesBy')} {w.writer_name}</Text>
          <Text style={{fontSize:12,fontWeight:'700',color:t.muted}}>{published} {tr(p,'books')}</Text>
        </View>
        {writerBooks.map(b=><Row key={b.id} book={b} theme={t} onPress={()=>p.open(b.id)}/>)}
      </>}
    </ScrollView>
  </Page>}

function Search(p:C){const [q,setQ]=useState('');const result=q?p.allBooks.filter(b=>`${b.title}${b.author}${b.category}`.includes(q)):p.allBooks.slice(0,3);return <Page theme={p.theme}><Back title="অনুসন্ধান" theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/><View style={[styles.search,{backgroundColor:p.theme.card,borderColor:p.theme.line}]}><Feather name="search" size={18} color={p.theme.muted}/><TextInput autoFocus value={q} onChangeText={setQ} placeholder="বই, লেখক বা বিভাগ খুঁজুন" placeholderTextColor={p.theme.muted} style={{flex:1,color:p.theme.ink}}/></View><Text style={[styles.group,{color:p.theme.muted}]}>{q?`${result.length}টি ফলাফল`:'জনপ্রিয় এখন'}</Text>{result.map(b=><Row key={b.id} book={b} theme={p.theme} onPress={()=>{p.update({searchHistory:[q,...p.state.searchHistory.filter(x=>x!==q)].filter(Boolean)});p.open(b.id)}}/>)}{!result.length&&<Empty theme={p.theme}/>}</Page>}
function Notifications(p:C){const [expanded,setExpanded]=useState<Record<string,boolean>>({});const toggle=(id:string)=>setExpanded(e=>({...e,[id]:!e[id]}));const allNotices=p.remoteNotices.map(n=>({id:n.id,title:n.title,body:n.body,icon:n.icon,url:n.url,time:n.time}));const iconBg=p.theme.primary+'22';const list=allNotices.map(n=>{const isRead=p.state.readNotifications.includes(n.id);const isExpanded=Boolean(expanded[n.id]);const hasLink=Boolean(n.url&&n.url.trim());const openLink=()=>{let u=n.url.trim();if(u&&!/^https?:\/\//i.test(u))u='https://'+u;Linking.openURL(u).catch(()=>{})};const needsExpand=n.body.length>80;return <Pressable key={n.id} onPress={()=>{p.update({readNotifications:[...new Set([...p.state.readNotifications,n.id])]});if(needsExpand)toggle(n.id);}} style={[styles.notifCard,{backgroundColor:isRead?p.theme.card:p.theme.tint,borderColor:p.theme.line,borderLeftColor:isRead?p.theme.line:p.theme.primary,borderLeftWidth:isRead?1:3}]}><View style={[styles.notifIconWrap,{backgroundColor:isRead?p.theme.line:iconBg}]}><Feather name={I(n.icon)} size={20} color={isRead?p.theme.muted:p.theme.primary}/></View><View style={{flex:1}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text numberOfLines={1} style={[styles.notifTitle,{color:isRead?p.theme.muted:p.theme.ink}]}>{n.title}</Text><View style={{flexDirection:'row',alignItems:'center',gap:6}}>{hasLink&&<Pressable onPress={openLink} style={[styles.notifLink,{borderColor:p.theme.primary}]}><Feather name="external-link" size={10} color={p.theme.primary}/><Text style={{color:p.theme.primary,fontSize:10,fontWeight:'700'}}>{tr(p,'openLink')}</Text></Pressable>}{!isRead&&<View style={[styles.notifLiveDot,{backgroundColor:p.theme.primary}]}/>}</View></View><Text numberOfLines={isExpanded?undefined:2} style={[styles.notifBody,{color:p.theme.muted}]}>{n.body}</Text><Text style={[styles.notifTime,{color:isRead?p.theme.line:p.theme.primary,marginTop:6}]}>{n.time}</Text></View></Pressable>});return <Page theme={p.theme}><Back title={tr(p,'notificationsTitle')} theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/>{list.length?list:<View style={{alignItems:'center',justifyContent:'center',minHeight:400}}><Feather name="bell-off" size={32} color={p.theme.line}/><Text style={{color:p.theme.muted,marginTop:10}}>{tr(p,'noNotifications')}</Text></View>}</Page>}
function BookList(p:C&{title:string;ids:string[]}){return <Page theme={p.theme}><Back title={p.title} theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/><Text style={{color:p.theme.muted,marginBottom:15}}>{p.ids.length}টি বই</Text>{p.ids.length?p.ids.map(id=>{const b=p.allBooks.find(x=>x.id===id);return b&&<Row key={id} book={b} theme={p.theme} onPress={()=>p.open(id)}/>}):<Empty theme={p.theme}/>}</Page>}
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
 chapter:{minHeight:70,borderRadius:16,borderWidth:1,padding:12,marginBottom:10,flexDirection:'row',alignItems:'center',gap:12},
 numGrad:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center'},
 cmtInput:{flex:1,minHeight:44,maxHeight:90,borderRadius:13,borderWidth:1,paddingHorizontal:12,paddingTop:11,fontSize:13},
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
 panel:{borderRadius:24,overflow:'hidden',borderWidth:1,marginBottom:16,elevation:5,shadowColor:'#000',shadowOpacity:.22,shadowRadius:12,shadowOffset:{width:0,height:6}},
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
  numBadge:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center'},

  writerCard:{width:152,borderRadius:20,borderWidth:1,overflow:'visible'},
  writerCardBg:{height:64,borderTopLeftRadius:20,borderTopRightRadius:20},
  writerAvatarWrap:{alignItems:'center',marginTop:-34,marginBottom:8},
  writerAvatar:{width:68,height:68,borderRadius:34,borderWidth:3,alignItems:'center',justifyContent:'center',overflow:'hidden'},
  writerCardBody:{alignItems:'center',paddingHorizontal:14,paddingBottom:14},
  writerName:{fontSize:14.5,fontWeight:'900',textAlign:'center'},
  writerUsername:{fontSize:11.5,fontWeight:'500',marginTop:2,textAlign:'center'},
  writerStatsRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,marginTop:10,paddingTop:10,borderTopWidth:1},
  writerStat:{flexDirection:'row',alignItems:'center',gap:3},
  writerStatNum:{fontSize:12,fontWeight:'800'},
  writerStatLabel:{fontSize:10,fontWeight:'600'},
  avatar:{width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center'}
 });
function Details(p:C&{book:Book}){const b=p.book;if(!b)return <Page theme={p.theme}><Back title={tr(p,'details')} theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/><Empty theme={p.theme}/></Page>;
  const t=p.theme,accent=b.accent||'#F5C660',base=b.color||'#123E39',dark=shade(base,-34);
  const fav=p.state.favorites.includes(b.id),isOffline=!!p.dlBooks[b.id],down=p.state.downloads.includes(b.id)||isOffline;
  const haveContent=b.chapters.length>0&&b.chapters.some(c=>c.body&&c.body.trim().length>0);
  const rxn=p.state.reactions[b.id];
  const [likes,setLikes]=useState<number>(b.likes||0);const [liked,setLiked]=useState<boolean>(rxn==='like');const [disliked,setDisliked]=useState<boolean>(rxn==='dislike');
  const [cmtCount,setCmtCount]=useState<number|null>(null);
  const [dlPct,setDlPct]=useState<number|null>(null);const dlTimer=useRef<any>(null);
  const likeAnim=useRef(new Animated.Value(1)).current;
  const fade=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.timing(fade,{toValue:1,duration:520,useNativeDriver:true}).start();fetchRemoteComments(b.id).then(c=>{if(c&&Array.isArray(c))setCmtCount(c.length)});return()=>{if(dlTimer.current)clearInterval(dlTimer.current)}},[b.id]);
  const setRxn=(v:'like'|'dislike'|undefined)=>{const rx={...p.state.reactions};if(v)rx[b.id]=v;else delete rx[b.id];p.update({reactions:rx})};
  const bumpLike=()=>{likeAnim.setValue(0.4);Animated.spring(likeAnim,{toValue:1,friction:3,tension:170,useNativeDriver:true}).start()};
  const doLike=()=>{if(liked){setLiked(false);setLikes(l=>Math.max(0,l-1));setRxn(undefined);Vibration.vibrate(30);toggleBookLike(p.state.deviceId,b.id,false).then(r=>{if(r>=0)setLikes(r)});}else{setLiked(true);setDisliked(false);setLikes(l=>l+1);setRxn('like');Vibration.vibrate([0,40,40,80]);bumpLike();toggleBookLike(p.state.deviceId,b.id,true).then(r=>{if(r>=0)setLikes(r)});}};
  const doDislike=()=>{if(disliked){setDisliked(false);setRxn(undefined);}else{setDisliked(true);setLiked(false);setRxn('dislike');Vibration.vibrate([0,40]);}};
  const likeScale=likeAnim.interpolate({inputRange:[0,1],outputRange:[0.5,1]});
  const doDownload=()=>{if(isOffline){p.removeDownload(b.id);return}if(!haveContent){Alert.alert(tr(p,'details'),'এই বইটিতে এখনো পড়ার মতো কোনো অধ্যায় নেই। যুক্ত হলে ডাউনলোড করা যাবে।');return}if(dlPct!==null)return;let pct=0;setDlPct(0);Vibration.vibrate(30);dlTimer.current=setInterval(()=>{pct+=Math.random()*6+5;if(pct>=100){pct=100;clearInterval(dlTimer.current);dlTimer.current=null;setDlPct(100);p.downloadBook(b.id);Vibration.vibrate([0,40,40,80]);setTimeout(()=>setDlPct(null),1600)}else setDlPct(Math.floor(pct))},110)};
  const goComments=()=>p.setScreen({type:'comments',id:b.id});const readAll=()=>p.read(b.id,0);
  const toggleFav=()=>{Vibration.vibrate(20);fav?p.update({favorites:p.state.favorites.filter(x=>x!==b.id)}):p.update({favorites:[...p.state.favorites,b.id]})};
  return <Page theme={t}>
    <Animated.View style={{opacity:fade}}>
      <View style={dStyles.nav}>
        <Pressable onPress={()=>p.setScreen({type:'main'})} hitSlop={10} style={[dStyles.navBtn,{backgroundColor:t.card,borderColor:t.line}]}><Feather name="arrow-left" size={19} color={t.ink}/></Pressable>
        <Text numberOfLines={1} style={[dStyles.navTitle,{color:t.ink}]}>{b.title}</Text>
        <Pressable onPress={toggleFav} hitSlop={8} style={[dStyles.navBtn,{backgroundColor:fav?'#EF4444':t.card,borderColor:fav?'#EF4444':t.line}]}><Feather name="heart" size={17} color={fav?'#fff':t.ink}/></Pressable>
        <Pressable onPress={()=>Share.share({message:`${b.title} - ${b.author}`})} hitSlop={8} style={[dStyles.navBtn,{backgroundColor:t.card,borderColor:t.line}]}><Feather name="share-2" size={17} color={t.ink}/></Pressable>
      </View>
      <View style={[dStyles.panel,{borderColor:'#00000022'}]}>
        <LinearGradient colors={[base,dark]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none"><Circle cx="96%" cy={8} r={88} fill={accent+'3B'}/><Ellipse cx="6%" cy={210} rx={150} ry={84} fill={accent+'1F'}/><Circle cx="72%" cy={200} r={66} fill="#ffffff12"/></Svg>
        <View style={dStyles.storyCard}>
          <View style={dStyles.coverBox}><Cover book={b}/></View>
          <View style={dStyles.storyInfo}>
            <View style={[dStyles.statusBadge,{backgroundColor:accent+'2E'}]}><Feather name={I(b.categoryIcon)} size={11} color={accent}/><Text style={{color:accent,fontSize:10.5,fontWeight:'900'}}>{b.category||tr(p,'chapters')}</Text></View>
            <Text numberOfLines={2} style={dStyles.storyTitle}>{b.title}</Text>
            <Text numberOfLines={1} style={dStyles.storyAuthor}>{b.author}</Text>
            <View style={dStyles.tagRow}>
              <View style={[dStyles.miniTag,{backgroundColor:'#ffffff1F'}]}><Feather name="star" size={10} color={accent}/><Text style={dStyles.miniTagT}>{b.rating}</Text></View>
              <View style={[dStyles.miniTag,{backgroundColor:'#ffffff1F'}]}><Feather name="book-open" size={10} color="#EAF4F1"/><Text style={dStyles.miniTagT}>{b.chapters.length} {tr(p,'chapters')}</Text></View>
              {b.isNew?<View style={[dStyles.miniTag,{backgroundColor:'#F59E0B'}]}><Text style={dStyles.miniTagT}>নতুন</Text></View>:null}
            </View>
          </View>
        </View>
      </View>
      <View style={[dStyles.interRow,{backgroundColor:t.card,borderColor:t.line}]}>
        {b.views_visible!==false?<View style={dStyles.statItem}><Feather name="eye" size={15} color={t.muted}/><Text style={[dStyles.statVal,{color:t.ink}]}>{b.views}</Text></View>:null}
        <View style={dStyles.statItem}><Animated.View style={{transform:[{scale:likeScale}]}}><Pressable onPress={doLike} hitSlop={8} style={[dStyles.ytBtn,{width:38,height:38,borderRadius:19,borderColor:liked?'#EF4444':t.line,backgroundColor:liked?'#EF4444':'transparent'}]}><Feather name="thumbs-up" size={15} color={liked?'#fff':t.ink}/></Pressable></Animated.View><Text style={[dStyles.statVal,{color:liked?'#EF4444':t.ink}]}>{likes}</Text></View>
        <Pressable onPress={doDislike} hitSlop={8} style={dStyles.statItem}><View style={[dStyles.ytBtn,{width:38,height:38,borderRadius:19,borderColor:disliked?'#3B82F6':t.line,backgroundColor:disliked?'#3B82F6':'transparent'}]}><Feather name="thumbs-down" size={14} color={disliked?'#fff':t.ink}/></View></Pressable>
        <Pressable onPress={goComments} hitSlop={8} style={dStyles.statItem}><Feather name="message-circle" size={16} color={cmtCount==null?'#90A4AE':t.primary}/><Text style={[dStyles.statVal,{color:cmtCount==null?t.muted:t.primary}]}>{cmtCount==null?'…':cmtCount}</Text></Pressable>
        <Pressable onPress={toggleFav} hitSlop={8} style={dStyles.statItem}><Feather name="bookmark" size={16} color={fav?'#EF4444':t.muted}/></Pressable>
      </View>
      <Pressable onPress={readAll} style={[dStyles.readBtn,{backgroundColor:t.primary,marginTop:2,marginBottom:10}]}><Feather name="book-open" size={18} color="#fff"/><Text style={dStyles.readBtnTxt}>{tr(p,'startReading')}</Text></Pressable>
      {isOffline?<Pressable onPress={doDownload} style={[dStyles.dlBtn,{backgroundColor:'#10B981',borderColor:'#10B981'}]}><Feather name="check-circle" size={18} color="#fff"/><Text style={{color:'#fff',fontWeight:'900',fontSize:15}}>{tr(p,'readOffline')}</Text></Pressable>:
      dlPct!==null?<View style={[dStyles.dlBtn,{backgroundColor:t.card,borderColor:t.line}]}><Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 3v10m0 0l-4-4m4 4l4-4" stroke={t.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg><Text style={{color:t.primary,fontWeight:'900',fontSize:14}}>{tr(p,'downloading')}… {dlPct}%</Text></View>:
      <Pressable onPress={doDownload} style={[dStyles.dlBtn,{backgroundColor:t.card,borderColor:t.line}]}><Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 3v10m0 0l-4-4m4 4l4-4" stroke={t.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={t.primary} strokeWidth={2} strokeLinecap="round"/></Svg><Text style={{color:t.primary,fontWeight:'900',fontSize:15}}>{tr(p,'readOffline')}</Text></Pressable>}
      <Section title={tr(p,'chapters')} theme={t}/>
      {b.chapters.length?b.chapters.map((c,i)=><Pressable key={c.id} onPress={()=>p.read(b.id,i)} style={[dStyles.chapter,{backgroundColor:t.card,borderColor:t.line}]}><View style={[dStyles.numBadge,{backgroundColor:accent+'1F'}]}><Text style={{color:accent,fontWeight:'900',fontSize:13}}>{i+1}</Text></View><View style={{flex:1}}><Text style={[styles.rowTitle,{color:t.ink}]}>{c.title}</Text><Text style={{color:t.muted,fontSize:11,marginTop:2}}>অধ্যায় {i+1} • {c.minutes} মিনিট</Text></View><Feather name="chevron-right" size={18} color={t.muted}/></Pressable>):<Empty theme={t}/>}
      <Section title={tr(p,'summary')} theme={t}/>
      <View style={[dStyles.sumCard,{backgroundColor:t.card,borderColor:t.line}]}><Text style={{color:t.ink,lineHeight:23}}>{b.description||'—'}</Text></View>
      <Pressable onPress={()=>Share.share({message:`${b.title} - ${b.author}`})} style={[dStyles.shareBtn,{borderColor:t.line}]}><Feather name="share-2" size={18} color={t.primary}/><Text style={{color:t.ink,fontWeight:'800'}}>{tr(p,'shareBook')}</Text></Pressable>
    </Animated.View>
  </Page>}
function Comments(p:C&{bookId:string}){const t=p.theme;const b=p.allBooks.find(x=>x.id===p.bookId)||p.dlBooks[p.bookId];const [items,setItems]=useState<{id:string;display_name:string;body:string;created_at:string}[]>([]);const [draft,setDraft]=useState('');const [posting,setPosting]=useState(false);const [loading,setLoading]=useState(true);
  const load=()=>fetchRemoteComments(p.bookId).then(c=>{if(c&&Array.isArray(c))setItems(c as any)}).finally(()=>setLoading(false));
  useEffect(()=>{load()},[p.bookId]);
  const post=async()=>{const x=draft.trim();if(!x||posting)return;setPosting(true);Vibration.vibrate(30);const ok=await submitComment(p.bookId,p.state.deviceId,p.state.name||'পাঠক',x);setPosting(false);if(ok){setDraft('');Alert.alert(tr(p,'postComment'),p.state.settings.language==='hi'?'आपकी टिप्पणी समीक्षा के बाद दिखाई देगी':p.state.settings.language==='en'?'Your comment will appear after moderation.':'আপনার মন্তব্যটি যাচাইয়ের পরে প্রকাশিত হবে')}load()};
  const insets=useSafeAreaInsets();
  return <KeyboardAvoidingView style={{flex:1,backgroundColor:t.bg}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={0}>
    <ScrollView style={{flex:1,backgroundColor:t.bg}} contentContainerStyle={{paddingHorizontal:18,paddingTop:insets.top+12,paddingBottom:130}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Back title={b?.title||tr(p,'comments')} theme={t} onPress={()=>p.setScreen({type:'book',id:p.bookId})}/>
      <Section title={tr(p,'comments')} theme={t}/>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}><Feather name="message-circle" size={16} color={t.primary}/><Text style={{color:t.muted,fontSize:13,fontWeight:'800'}}>{items.length} {tr(p,'comments')}</Text><Pressable onPress={load} hitSlop={8}><Feather name="refresh-cw" size={14} color={t.primary}/></Pressable></View>
      <View style={[dStyles.composer,{borderColor:t.line,backgroundColor:t.card,elevation:2,shadowColor:'#000',shadowOpacity:.06,shadowRadius:8,shadowOffset:{width:0,height:3}}]}>
        <View style={[dStyles.avatar2,{backgroundColor:t.tint}]}><Text style={{color:t.primary,fontWeight:'900',fontSize:14}}>{(p.state.name||'?')[0]}</Text></View>
        <TextInput value={draft} onChangeText={setDraft} placeholder={tr(p,'writeComment')} placeholderTextColor={t.muted} multiline style={[dStyles.cmtInput,{flex:1,color:t.ink,backgroundColor:t.bg,borderColor:t.line}]}/>
        <Pressable disabled={!draft.trim()||posting} onPress={post} style={[dStyles.postBtn,{backgroundColor:!draft.trim()?'#90A4AE':t.primary,opacity:posting?.6:1,paddingHorizontal:16}]}><Text style={{color:'#fff',fontWeight:'900',fontSize:12}}>{posting?'...':tr(p,'postComment')}</Text></Pressable>
      </View>
      <View style={{marginTop:4}}>
        {loading?<View style={{alignItems:'center',paddingVertical:34}}><ActivityIndicator color={t.primary}/></View>:
        !items.length?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="message-circle" size={30} color={t.muted}/><Text style={{color:t.muted,fontSize:13,marginTop:10,textAlign:'center'}}>{tr(p,'noComments')}</Text></View>:
        items.map(c=><View key={c.id} style={[dStyles.cmtItem,{width:'100%',borderBottomWidth:1,borderBottomColor:t.line,paddingVertical:12}]}><View style={[dStyles.avatar,{backgroundColor:t.tint}]}><Text style={{color:t.primary,fontWeight:'900'}}>{(c.display_name||'?')[0]}</Text></View><View style={{flex:1}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={[styles.rowTitle,{color:t.ink,fontSize:13}]}>{c.display_name}</Text><Text style={{color:t.line,fontSize:10}}>{new Date(c.created_at).toLocaleDateString()}</Text></View><Text style={{color:t.ink,fontSize:13,lineHeight:19,marginTop:2}}>{c.body}</Text></View></View>)}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
}
function Reader(p:C&{book:Book;chapter:number}){const insets=useSafeAreaInsets();const {width}=useWindowDimensions();const c=p.book.chapters[p.chapter];if(!c)return <View style={{flex:1,backgroundColor:p.theme.reader,alignItems:'center',justifyContent:'center',padding:30}}><Feather name="book-open" size={40} color={p.theme.muted}/><Text style={{color:p.theme.ink,fontWeight:'800',fontSize:16,textAlign:'center',marginTop:14}}>এই বইয়ে এখনো কোনো অধ্যায় নেই।</Text><Button title="ফিরে যান" icon="arrow-left" onPress={()=>p.setScreen({type:'book',id:p.book.id})}/></View>;const key=c.id,progress=p.state.positions[key]||0;
useEffect(()=>{const today=new Date().toISOString().slice(0,10);const prev=p.state.readingActivity[today]||{minutes:0,episodes:0};if(!prev.episodes||!prev.minutes){p.update({readingActivity:{...p.state.readingActivity,[today]:{minutes:prev.minutes+(c.minutes||5),episodes:prev.episodes+1}}})}},[c.id]);
const change=(patch:Partial<LocalState['settings']>)=>p.update({settings:{...p.state.settings,...patch}});const readerSize=Math.max(16,Math.min(25,p.state.settings.fontSize));const readerLine=Math.round(Math.max(readerSize+6,Math.min(48,p.state.settings.lineHeight))*p.state.settings.lineSpacing);const readerFont=p.state.settings.fontFamily==='serif'?'serif':(p.state.settings.fontFamily==='loose'?'sans-serif':undefined);const sidePadding=Math.max(18,Math.min(30,Math.round(width*.07)));return <View style={{flex:1,backgroundColor:p.theme.reader}}><View style={[styles.readerHead,{borderBottomColor:p.theme.line,paddingTop:insets.top+8,paddingBottom:10}]}><Pressable hitSlop={10} onPress={()=>p.setScreen({type:'book',id:p.book.id})}><Feather name="arrow-left" size={22} color={p.theme.ink}/></Pressable><View style={{flex:1,marginLeft:16}}><Text allowFontScaling={false} numberOfLines={1} style={{color:p.theme.ink,fontWeight:'900'}}>{c.title}</Text><Text allowFontScaling={false} numberOfLines={1} style={{color:p.theme.muted,fontSize:10}}>{p.book.title}</Text></View><Pressable hitSlop={10} onPress={()=>p.update({bookmarks:p.state.bookmarks.includes(key)?p.state.bookmarks.filter(x=>x!==key):[...p.state.bookmarks,key]})}><Feather name="bookmark" size={21} color={p.state.bookmarks.includes(key)?p.theme.primary:p.theme.ink}/></Pressable></View><ScrollView showsVerticalScrollIndicator={false} onScroll={e=>{const n=e.nativeEvent;const v=Math.round(n.contentOffset.y/Math.max(1,n.contentSize.height-n.layoutMeasurement.height)*100);if(Math.abs(v-progress)>15)p.update({positions:{...p.state.positions,[key]:v}})}} scrollEventThrottle={800} contentContainerStyle={[styles.readerBody,{paddingHorizontal:sidePadding,paddingBottom:insets.bottom+110}]}><Text allowFontScaling={false} style={{color:p.theme.primary,textAlign:'center',fontWeight:'900'}}>অধ্যায় {p.chapter+1}</Text><Text allowFontScaling={false} style={[styles.readerTitle,{color:p.theme.ink,fontSize:Math.min(30,Math.max(25,width*.075))}]}>{c.title}</Text><Text allowFontScaling={false} style={{color:p.theme.ink,fontSize:readerSize,lineHeight:readerLine,fontFamily:readerFont,maxWidth:680,alignSelf:'center'}}>{c.body}</Text><Text allowFontScaling={false} style={{textAlign:'center',color:p.theme.primary,fontSize:25,marginTop:30}}>❦</Text></ScrollView><View style={[styles.readerTools,{backgroundColor:p.theme.card,borderTopColor:p.theme.line,paddingBottom:Math.max(8,insets.bottom),paddingTop:10}]}><Pressable hitSlop={8} disabled={p.chapter===0} onPress={()=>p.read(p.book.id,p.chapter-1)}><Text allowFontScaling={false} style={{color:p.theme.ink,fontSize:12,fontWeight:'700',opacity:p.chapter===0?.3:1}}>← আগের</Text></Pressable><Pressable hitSlop={8} onPress={()=>change({fontSize:Math.max(15,p.state.settings.fontSize-1)})}><Text allowFontScaling={false} style={{color:p.theme.primary,fontWeight:'900'}}>A−</Text></Pressable><Pressable hitSlop={8} onPress={()=>change({fontSize:Math.min(28,p.state.settings.fontSize+1)})}><Text allowFontScaling={false} style={{color:p.theme.primary,fontWeight:'900'}}>A+</Text></Pressable><Pressable hitSlop={8} onPress={()=>change({dark:!p.state.settings.dark})}><Feather name="moon" size={19} color={p.theme.primary}/></Pressable><Pressable hitSlop={8} disabled={p.chapter===p.book.chapters.length-1} onPress={()=>p.read(p.book.id,p.chapter+1)}><Text allowFontScaling={false} style={{color:p.theme.ink,fontSize:12,fontWeight:'700',opacity:p.chapter===p.book.chapters.length-1?.3:1}}>পরের →</Text></Pressable></View></View>}
function AnimatedToggle({value,onChange,color,track}:{value:boolean;onChange:(v:boolean)=>void;color:string;track:string}){
  const anim=useRef(new Animated.Value(value?1:0)).current;
  useEffect(()=>{Animated.timing(anim,{toValue:value?1:0,duration:230,useNativeDriver:true}).start();},[value,anim]);
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
    {id:'katagolap',nameBn:'কাঠগোলাপ',nameEn:'Rosewood',colors:['#087A63','#172421']},
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

  return <Page theme={t}>
    <Back title={tr(p,'settings')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>

    <Text style={[styles.group,{color:t.muted,marginTop:4}]}>Themes</Text>
    <View style={{borderRadius:18,borderWidth:1,borderColor:t.line,backgroundColor:t.card,padding:9}}>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:5}}>
        {themes.map(th=>{
          const selected=currentThemeId===th.id;
          const selTheme=themeFor(th.id,false);
          const flowerKinds=new Set(['shapla','golap']);
          const isFlower=flowerKinds.has(th.id);
          return <Pressable key={th.id} onPress={()=>set({themeId:th.id})}
            style={{width:'18.5%',borderRadius:11,overflow:'hidden',borderWidth:1.5,borderColor:selected?t.primary:selTheme.line,backgroundColor:selTheme.card}}>
            <View style={{backgroundColor:selTheme.bg,alignItems:'center',justifyContent:'center',paddingVertical:9,opacity:0.95}}>
              <FlowerArt kind={isFlower?th.id:'dot'} s={36} primary={selTheme.primary} tint={selTheme.tint} bg={selTheme.bg}/>
            </View>
            <View style={{alignItems:'center',paddingVertical:3}}>
              <Text style={{fontSize:8,fontWeight:'800',color:selTheme.ink}} numberOfLines={1}>{th.nameEn}</Text>
            </View>
            {selected&&<View style={{position:'absolute',top:3,right:3,width:13,height:13,borderRadius:7,backgroundColor:t.primary,alignItems:'center',justifyContent:'center'}}><Feather name="check" size={8} color="#fff"/></View>}
          </Pressable>})}
      </View>
    </View>

    <Text style={[styles.group,{color:t.muted}]}>{tr(p,'appearance')}</Text>
    <View style={styles.menuGroup}>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:darkMode?'#1E293B':t.tint}]}><Feather name={darkMode?'moon':'sun'} size={18} color={darkMode?'#FCD34D':t.primary}/></View>
        <View style={{flex:1}}>
          <Text style={[styles.rowTitle,{color:t.ink}]}>{darkMode?tr(p,'darkMode'):tr(p,'lightMode')}</Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{darkMode?tr(p,'darkModeSub'):tr(p,'lightModeSub')}</Text>
        </View>
        <AnimatedToggle value={darkMode} onChange={(v)=>set({dark:v})} color={t.primary} track={t.line}/>
      </View>
      <View style={[styles.menuSep,{backgroundColor:t.line,marginLeft:62}]}/>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="type" size={18} color={t.primary}/></View>
        <Text style={[styles.rowTitle,{color:t.ink,flex:1}]}>{tr(p,'readerSize')}</Text>
        <View style={{alignItems:'center'}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
            <Pressable onPress={()=>{const f=Math.max(16,p.state.settings.fontSize-2);set({fontSize:f,lineHeight:f+13});}} style={{width:34,height:34,borderRadius:11,backgroundColor:p.state.settings.fontSize<=16?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}>
              <Feather name="minus" size={17} color={p.state.settings.fontSize<=16?t.muted:t.primary}/>
            </Pressable>
            <View style={{width:58,height:58,borderRadius:18,borderWidth:2,borderColor:t.line,backgroundColor:t.bg,alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:Math.max(12,p.state.settings.fontSize-2),fontWeight:'900',color:t.ink,lineHeight:Math.max(12,p.state.settings.fontSize-2)+6}}>Aa</Text>
            </View>
            <Pressable onPress={()=>{const f=Math.min(28,p.state.settings.fontSize+2);set({fontSize:f,lineHeight:f+13});}} style={{width:34,height:34,borderRadius:11,backgroundColor:p.state.settings.fontSize>=28?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}>
              <Feather name="plus" size={17} color={p.state.settings.fontSize>=28?t.muted:t.primary}/>
            </Pressable>
          </View>
          <Text style={{color:t.muted,fontSize:10,marginTop:4}}>{p.state.settings.fontSize}px</Text>
        </View>
      </View>
    </View>

    <Text style={[styles.group,{color:t.muted}]}>Reading</Text>
    <View style={styles.menuGroup}>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="align-justify" size={18} color={t.primary}/></View>
        <View style={{flex:1}}>
          <Text style={[styles.rowTitle,{color:t.ink}]}>Line spacing</Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>লাইনের ফাঁক সামঞ্জস্য করুন</Text>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Pressable onPress={()=>set({lineSpacing:Math.round((Math.max(0.8,p.state.settings.lineSpacing-0.1))*10)/10})} style={{width:30,height:30,borderRadius:9,backgroundColor:p.state.settings.lineSpacing<=0.8?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}><Feather name="minus" size={15} color={p.state.settings.lineSpacing<=0.8?t.muted:t.primary}/></Pressable>
          <Text style={{color:t.ink,fontWeight:'800',fontSize:13,width:30,textAlign:'center'}}>{p.state.settings.lineSpacing.toFixed(1)}</Text>
          <Pressable onPress={()=>set({lineSpacing:Math.round((Math.min(1.8,p.state.settings.lineSpacing+0.1))*10)/10})} style={{width:30,height:30,borderRadius:9,backgroundColor:p.state.settings.lineSpacing>=1.8?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}><Feather name="plus" size={15} color={p.state.settings.lineSpacing>=1.8?t.muted:t.primary}/></Pressable>
        </View>
      </View>
      <View style={[styles.menuSep,{backgroundColor:t.line,marginLeft:62}]}/>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="align-left" size={18} color={t.primary}/></View>
        <Text style={[styles.rowTitle,{color:t.ink,flex:1}]}>Font</Text>
        <View style={{flexDirection:'row',gap:6}}>
          {([['default','Default'],['serif','Serif'],['loose','Loose']] as const).map(([k,l])=>{
            const act=p.state.settings.fontFamily===k;
            return <Pressable key={k} onPress={()=>set({fontFamily:k})} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:9,backgroundColor:act?t.primary:t.bg,borderWidth:1,borderColor:act?t.primary:t.line}}><Text style={{fontWeight:'800',fontSize:11,color:act?'#fff':t.muted}}>{l}</Text></Pressable>;
          })}
        </View>
      </View>
    </View>

    <Text style={[styles.group,{color:t.muted}]}>{tr(p,'language')}</Text>
    <View style={[styles.languageBox,{backgroundColor:t.card,borderColor:t.line}]}>
      {([['en','english'],['bn','bangla'],['hi','hindi']] as const).map(([code,key],i)=>(
        <Pressable key={code} onPress={()=>{set({language:code})}} style={[styles.languageRow,{borderBottomWidth:i===2?0:1,borderBottomColor:t.line}]}>
          <View style={[styles.radio,{borderColor:language===code?t.primary:t.muted}]}>{language===code&&<View style={[styles.radioDot,{backgroundColor:t.primary}]}/>}</View>
          <View style={{flex:1}}>
            <Text style={{color:t.ink,fontWeight:language===code?'900':'600'}}>{copy(code,key)}</Text>
            <Text style={{color:t.muted,fontSize:10}}>{code==='en'?'English':code==='bn'?'বাংলা':'हिन्दी'}</Text>
          </View>
          {language===code&&<Feather name="check" size={16} color={t.primary}/>}
        </Pressable>))}
    </View>

    <Text style={[styles.group,{color:t.muted}]}>{tr(p,'data')}</Text>
    <View style={styles.menuGroup}>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="bell" size={18} color={t.primary}/></View>
        <Text style={[styles.rowTitle,{color:t.ink,flex:1}]}>{tr(p,'newAlerts')}</Text>
        <Switch value={p.state.settings.notifications} onValueChange={v=>set({notifications:v})} trackColor={{true:t.primary}}/>
      </View>
      <View style={[styles.menuSep,{backgroundColor:t.line,marginLeft:62}]}/>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="wifi" size={18} color={t.primary}/></View>
        <Text style={[styles.rowTitle,{color:t.ink,flex:1}]}>{tr(p,'wifi')}</Text>
        <Switch value={p.state.settings.wifiOnly} onValueChange={v=>set({wifiOnly:v})} trackColor={{true:t.primary}}/>
      </View>
    </View>

    <Text style={[styles.group,{color:t.muted}]}>Sync</Text>
    <View style={styles.menuGroup}>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:p.state.online?t.tint:'#FEEBC8'}]}><Feather name={p.state.online?'refresh-cw':'cloud-off'} size={18} color={p.state.online?t.primary:'#B45309'}/></View>
        <View style={{flex:1}}>
          <Text style={[styles.rowTitle,{color:t.ink}]}>Sync now</Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.online?'সর্বশেষ sync: সব ঠিক আছে':'অফলাইন — ক্যাশ থেকে পড়া চলবে'}</Text>
        </View>
        <Pressable onPress={()=>{trackEvent(p.state.deviceId,'all','view');Alert.alert(tr(p,'sync'),p.state.online?'Content synced successfully.':'Offline — using cached content.')}} style={{backgroundColor:t.tint,borderRadius:10,paddingVertical:8,paddingHorizontal:12}}><Text style={{color:t.primary,fontWeight:'900',fontSize:12}}>{p.state.online?'Synced':'Offline'}</Text></Pressable>
      </View>
      <View style={[styles.menuSep,{backgroundColor:t.line,marginLeft:62}]}/>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:'#FEEBC8'}]}><Feather name="trash-2" size={18} color="#B45309"/></View>
        <Text style={[styles.rowTitle,{color:t.ink,flex:1}]}>{tr(p,'clearSearch')}</Text>
        <Feather name="chevron-right" size={18} color={t.muted}/>
        <Pressable onPress={()=>p.update({searchHistory:[]})} style={{borderWidth:1,borderColor:t.line,borderRadius:10,paddingVertical:7,paddingHorizontal:12}}><Text style={{color:t.primary,fontWeight:'800',fontSize:12}}>Clear</Text></Pressable>
      </View>
    </View>

    <Text style={[styles.group,{color:t.muted}]}>Downloads</Text>
    <View style={styles.menuGroup}>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="download-cloud" size={18} color={t.primary}/></View>
        <View style={{flex:1}}>
          <Text style={[styles.rowTitle,{color:t.ink}]}>{p.state.downloads.length} downloaded</Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>অফলাইনে পড়ার জন্য বই সংরক্ষিত</Text>
        </View>
        <View style={{backgroundColor:t.bg,borderWidth:1,borderColor:t.line,borderRadius:9,paddingVertical:6,paddingHorizontal:10}}><Text style={{color:t.muted,fontSize:11,fontWeight:'700'}}>{(p.state.downloads.length*0.6).toFixed(1)} MB</Text></View>
      </View>
      <View style={[styles.menuSep,{backgroundColor:t.line,marginLeft:62}]}/>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:'#FEEBC8'}]}><Feather name="trash-2" size={18} color="#B45309"/></View>
        <View style={{flex:1}}>
          <Text style={[styles.rowTitle,{color:t.ink}]}>Clear all downloads</Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>সব ডাউনলোড মুছে ফেলুন</Text>
        </View>
        <Pressable onPress={()=>Alert.alert('Clear downloads','সব ডাউনলোড মুছে ফেলা হবে। নিশ্চিত?',[{text:'Cancel',style:'cancel'},{text:'Clear',style:'destructive',onPress:()=>p.update({downloads:[]})}])} style={{backgroundColor:'#FEEBC8',borderRadius:10,paddingVertical:8,paddingHorizontal:12}}><Text style={{color:'#B45309',fontWeight:'900',fontSize:12}}>Clear</Text></Pressable>
      </View>
    </View>

    <Text style={[styles.group,{color:t.muted}]}>Storage</Text>
    <View style={styles.menuGroup}>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="hard-drive" size={18} color={t.primary}/></View>
        <View style={{flex:1}}>
          <Text style={[styles.rowTitle,{color:t.ink}]}>Reset app</Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>সব ডেটা মুছে নতুন করে শুরু করুন</Text>
        </View>
        <Pressable onPress={()=>Alert.alert('Reset app','থিম, বুকমার্ক, ইতিহাস — সব ডেটা মুছে যাবে। নিশ্চিত?',[{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:async()=>{p.update(initialState);await clearState();}}])} style={{backgroundColor:'#FEE2E2',borderRadius:10,paddingVertical:8,paddingHorizontal:12}}><Text style={{color:'#B91C1C',fontWeight:'900',fontSize:12}}>Reset</Text></Pressable>
      </View>
    </View>

    <Text style={[styles.group,{color:t.muted}]}>About</Text>
    <View style={styles.menuGroup}>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="book-open" size={18} color={t.primary}/></View>
        <View style={{flex:1}}>
          <Text style={[styles.rowTitle,{color:t.ink}]}>Lekhoni Kahini</Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>বাংলা গল্পের রিডার</Text>
        </View>
        <Text style={{color:t.muted,fontSize:12,fontWeight:'700'}}>v1.0.0</Text>
      </View>
      <View style={[styles.menuSep,{backgroundColor:t.line,marginLeft:62}]}/>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="star" size={18} color={t.primary}/></View>
        <Text style={[styles.rowTitle,{color:t.ink,flex:1}]}>Rate this app</Text>
        <Pressable onPress={()=>{try{Linking.openURL('https://admin.xyteee.com')}catch{}} } style={{backgroundColor:t.tint,borderRadius:10,paddingVertical:8,paddingHorizontal:12}}><Text style={{color:t.primary,fontWeight:'900',fontSize:12}}>Rate</Text></Pressable>
      </View>
    </View>

    <Text style={[styles.group,{color:t.muted}]}>Online backup</Text>
    <View style={[styles.menuItem,{flexDirection:'column',alignItems:'flex-start',backgroundColor:t.card,borderRadius:18,borderWidth:1,borderColor:t.line,padding:16}]}>
      <View style={{flexDirection:'row',alignItems:'center',gap:12,width:'100%',marginBottom:10}}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name={p.state.online?'cloud':'cloud-off'} size={18} color={p.state.online?t.primary:t.muted}/></View>
        <View style={{flex:1}}>
          <Text style={[styles.rowTitle,{color:t.ink}]}>Settings backup</Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.online?'Theme, bookmarks & progress restored on this device.':'Offline — will sync when connected.'}</Text>
        </View>
        <View style={{width:10,height:10,borderRadius:5,backgroundColor:p.state.online?'#2AA876':'#D9A407'}}/>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:t.bg,borderRadius:10,paddingHorizontal:12,paddingVertical:9,borderWidth:1,borderColor:t.line,width:'100%'}}>
        <Text style={{fontSize:10,color:t.muted}}>Restore code</Text>
        <Text style={{fontSize:12,fontWeight:'700',color:t.ink,flex:1}} selectable>{('LK-'+p.state.deviceId.split('-')[0]+'-'+p.state.deviceId.split('-')[3]).toUpperCase()}</Text>
      </View>
      <Text style={{fontSize:10,color:t.muted,marginTop:8,lineHeight:15}}>Keep this code to restore your settings if you reinstall the app on this device.</Text>
    </View>
  </Page>}
function Writer(p:C){
  const[authTab,setAuthTab]=useState<'login'|'register'>('login');
  const[form,setForm]=useState({username:'',writerName:'',email:'',password:''});
  const[authErr,setAuthErr]=useState('');
  const[loading,setLoading]=useState(false);
  const[studioTab,setStudioTab]=useState<'dashboard'|'stories'|'profile'|'notifications'>('dashboard');
  const[unreadCount,setUnreadCount]=useState(0);
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

  const handleAuth=async()=>{
    if(!form.password){setAuthErr(tr(p,'allFieldsRequired'));return}
    if(authTab==='register'){
      if(!form.username.trim()||!form.writerName.trim()||!form.email.trim()){setAuthErr(tr(p,'allFieldsRequired'));return}
    }else{
      if(!form.email.trim()){setAuthErr(tr(p,'allFieldsRequired'));return}
    }
    setLoading(true);setAuthErr('');
    try{
      if(authTab==='register'){
        const w=await writerSignup(form.username.trim(),form.writerName.trim(),form.email.trim(),form.password);
        if(w){p.update({writer:{id:w.writer.id,username:w.writer.username,writer_name:w.writer.writer_name,avatar_url:w.writer.avatar_url||undefined,bio:w.writer.bio||undefined},writerToken:w.token});setForm({username:'',writerName:'',email:'',password:''})}
        else{setAuthErr(tr(p,'accountExists'))}
      }else{
        const w=await writerLogin(form.email.trim(),form.password);
        if(w){p.update({writer:{id:w.writer.id,username:w.writer.username,writer_name:w.writer.writer_name,avatar_url:w.writer.avatar_url||undefined,bio:w.writer.bio||undefined},writerToken:w.token});setForm({username:'',writerName:'',email:'',password:''})}
        else setAuthErr(tr(p,'wrongCredentials'))
      }
    }catch{setAuthErr(tr(p,'networkError'))}finally{setLoading(false)}
  };

  if(!isLoggedIn)return <KeyboardAvoidingView style={{flex:1,backgroundColor:t.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
    <ScrollView contentContainerStyle={{flexGrow:1,padding:22,paddingTop:50}} keyboardShouldPersistTaps="handled">
    <View style={{alignItems:'center',marginBottom:24}}>
      <Image source={require('./assets/adaptive-icon.png')} style={{width:72,height:72,borderRadius:18}} resizeMode="contain"/>
      <Text style={{color:t.ink,fontSize:20,fontWeight:'600',marginTop:14,textAlign:'center'}}>{tr(p,'welcomeWriter')}</Text>
      <Text style={{color:t.muted,fontSize:13,marginTop:4,textAlign:'center'}}>{tr(p,'storiesWaiting')}</Text>
    </View>
    <View style={{backgroundColor:t.card,borderRadius:18,padding:20,marginBottom:16,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',backgroundColor:t.bg,borderRadius:12,padding:3,marginBottom:18}}>
        <Pressable onPress={()=>{setAuthTab('login');setAuthErr('')}} style={{flex:1,borderRadius:10,paddingVertical:10,alignItems:'center',backgroundColor:authTab==='login'?t.primary:'transparent'}}><Text style={{color:authTab==='login'?'#fff':t.muted,fontWeight:'600',fontSize:13}}>{tr(p,'login')}</Text></Pressable>
        <Pressable onPress={()=>{setAuthTab('register');setAuthErr('')}} style={{flex:1,borderRadius:10,paddingVertical:10,alignItems:'center',backgroundColor:authTab==='register'?t.primary:'transparent'}}><Text style={{color:authTab==='register'?'#fff':t.muted,fontWeight:'600',fontSize:13}}>{tr(p,'register')}</Text></Pressable>
      </View>
      {authTab==='register'&&<>
      <View style={{marginBottom:12}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{tr(p,'username')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="at-sign" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.username} onChangeText={v=>setForm({...form,username:v})} placeholder={tr(p,'username')} placeholderTextColor={t.muted+'88'} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400'}}/>
        </View>
      </View>
      <View style={{marginBottom:12}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{tr(p,'writerName')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="feather" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.writerName} onChangeText={v=>setForm({...form,writerName:v})} placeholder={tr(p,'writerName')} placeholderTextColor={t.muted+'88'} style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400'}}/>
        </View>
      </View>
      </>}
      <View style={{marginBottom:12}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{authTab==='login'?tr(p,'emailOrUsername'):tr(p,'email')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="user" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.email} onChangeText={v=>setForm({...form,email:v})} placeholder={authTab==='login'?tr(p,'emailOrUsername'):tr(p,'email')} placeholderTextColor={t.muted+'88'} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400'}}/>
        </View>
      </View>
      <View style={{marginBottom:authErr?8:16}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{tr(p,'password')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="lock" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.password} onChangeText={v=>setForm({...form,password:v})} placeholder={tr(p,'password')} placeholderTextColor={t.muted+'88'} secureTextEntry style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400'}}/>
        </View>
      </View>
      {authErr?<View style={{backgroundColor:'#FEF2F2',borderRadius:10,padding:10,marginBottom:12,flexDirection:'row',alignItems:'center',gap:6}}><Feather name="alert-circle" size={14} color="#EF4444"/><Text style={{color:'#EF4444',fontSize:12,fontWeight:'500',flex:1}}>{authErr}</Text></View>:null}
      <Pressable disabled={loading} onPress={handleAuth} style={{backgroundColor:t.primary,borderRadius:12,height:46,alignItems:'center',justifyContent:'center',opacity:loading?0.6:1}}>
        {loading?<ActivityIndicator color="#fff" size="small"/>:<Text style={{color:'#fff',fontWeight:'600',fontSize:14}}>{authTab==='register'?tr(p,'createAccount'):tr(p,'login')}</Text>}
      </Pressable>
      <Text style={{color:t.muted,fontSize:12,textAlign:'center',marginTop:14}}>
        {authTab==='login'?tr(p,'noAccount'):tr(p,'alreadyAccount')}{' '}
        <Text onPress={()=>{setAuthTab(authTab==='login'?'register':'login');setAuthErr('')}} style={{color:t.primary,fontWeight:'600'}}>
          {authTab==='login'?tr(p,'registerHere'):tr(p,'loginHere')}</Text>
      </Text>
    </View>
    </ScrollView>
  </KeyboardAvoidingView>;

  const tabs:[string,string,string][]=[['dashboard',tr(p,'dashboard'),'bar-chart-2'],['stories',tr(p,'myStories'),'book-open'],['profile',tr(p,'profile'),'user']];

  return <Page theme={t}>
    <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:16,padding:14,marginBottom:16,borderWidth:1,borderColor:t.line}}>
      {p.state.writer?.avatar_url?<Image source={{uri:p.state.writer.avatar_url}} style={{width:48,height:48,borderRadius:24}}/>:<View style={{width:48,height:48,borderRadius:24,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',elevation:3,shadowColor:t.primary,shadowOffset:{width:0,height:3},shadowOpacity:0.25,shadowRadius:6}}>
        <Text style={{fontSize:20,fontWeight:'900',color:'#fff'}}>{p.state.writer?.writer_name?.[0]?.toUpperCase()||'?'}</Text>
      </View>}
      <View style={{flex:1,marginLeft:12}}>
        <Text numberOfLines={1} style={{fontSize:17,fontWeight:'900',color:t.ink}}>{p.state.writer?.writer_name}</Text>
        <Text style={{fontSize:12,color:t.muted,marginTop:1}}>{tr(p,'writerStudio')}</Text>
      </View>
      <Pressable onPress={()=>{setStudioTab('notifications');setUnreadCount(0)}} style={{width:40,height:40,borderRadius:12,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:8}}>
        <Feather name="bell" size={18} color={t.primary}/>
        {unreadCount>0&&<View style={{position:'absolute',top:-3,right:-3,backgroundColor:'#EF4444',borderRadius:8,minWidth:16,height:16,alignItems:'center',justifyContent:'center',paddingHorizontal:4}}>
          <Text style={{color:'#fff',fontSize:9,fontWeight:'900'}}>{unreadCount>9?'9+':unreadCount}</Text>
        </View>}
      </Pressable>
      <Pressable onPress={()=>p.update({writer:null,writerToken:null})} style={{width:36,height:36,borderRadius:10,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="log-out" size={16} color={t.primary}/>
      </Pressable>
    </View>
    <View style={{flexDirection:'row',gap:5,marginBottom:18}}>
      {tabs.map(([key,label,icon])=><Pressable key={key} onPress={()=>{setStudioTab(key as any);if(key==='notifications')setUnreadCount(0)}} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,backgroundColor:studioTab===key?t.primary:t.card,borderRadius:10,paddingVertical:9,borderWidth:1,borderColor:studioTab===key?t.primary:t.line}}>
        <Feather name={icon as any} size={13} color={studioTab===key?'#fff':t.muted}/>
        <Text style={{color:studioTab===key?'#fff':t.muted,fontWeight:'800',fontSize:11}}>{label}</Text>
        {key==='notifications'&&unreadCount>0&&<View style={{backgroundColor:studioTab===key?'rgba(255,255,255,0.3)':'#EF4444',borderRadius:6,minWidth:14,height:14,alignItems:'center',justifyContent:'center',paddingHorizontal:3}}>
          <Text style={{color:'#fff',fontSize:8,fontWeight:'900'}}>{unreadCount>9?'9+':unreadCount}</Text>
        </View>}
      </Pressable>)}
    </View>
    {studioTab==='dashboard'&&<WriterDashboard token={token} theme={t} lang={lang}/>}
    {studioTab==='stories'&&<WriterStories token={token} theme={t} lang={lang} categories={p.allCategories.map(c=>c[0])}/>}
    {studioTab==='profile'&&<WriterProfileStudio token={token} theme={t} writer={p.state.writer} lang={lang} onUpdate={(patch)=>p.update({writer:{...p.state.writer!,...patch}})}/>}
    {studioTab==='notifications'&&<WriterNotifs token={token} theme={t} lang={lang}/>}
  </Page>}

function WriterDashboard({token,theme:t,lang}:{token:string;theme:Theme;lang:Language}){
  const[d,setD]=useState<{stories:number;totalViews:number;followers:number;published:number;pending:number;recent:any[];activities:any[]}>({stories:0,totalViews:0,followers:0,published:0,pending:0,recent:[],activities:[]});
  const[loading,setLoading]=useState(true);
  useEffect(()=>{fetchWriterDashboard(token).then(s=>{if(s)setD(s)}).finally(()=>setLoading(false))},[token]);
  if(loading)return <View style={{alignItems:'center',paddingVertical:60}}><ActivityIndicator size="large" color={t.primary}/></View>;
  const cards:{icon:string;label:string;value:number;bg:string}[]=[
    {icon:'book-open',label:copy(lang,'myStories'),value:d.stories,bg:t.primary},
    {icon:'eye',label:copy(lang,'totalViews'),value:d.totalViews,bg:'#6366F1'},
    {icon:'users',label:copy(lang,'followers'),value:d.followers,bg:'#F59E0B'},
    {icon:'check-circle',label:copy(lang,'publishedStories'),value:d.published,bg:'#10B981'},
  ];
  return <ScrollView showsVerticalScrollIndicator={false}>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:18}}>
      {cards.map((c,i)=><View key={i} style={{width:'47%',backgroundColor:t.card,borderRadius:14,padding:14,borderWidth:1,borderColor:t.line}}>
        <View style={{width:34,height:34,borderRadius:10,backgroundColor:c.bg+'18',alignItems:'center',justifyContent:'center',marginBottom:8}}>
          <Feather name={c.icon as any} size={16} color={c.bg}/>
        </View>
        <Text style={{fontSize:22,fontWeight:'900',color:t.ink}}>{c.value}</Text>
        <Text style={{fontSize:10,fontWeight:'700',color:t.muted,marginTop:2}}>{c.label}</Text>
      </View>)}
    </View>
    {d.pending>0&&<View style={{backgroundColor:'#FEF3C7',borderRadius:12,padding:12,marginBottom:14,flexDirection:'row',alignItems:'center',gap:8}}>
      <Feather name="clock" size={16} color="#D97706"/>
      <Text style={{fontSize:13,fontWeight:'700',color:'#92400E',flex:1}}>{d.pending} {copy(lang,'pendingReview')}</Text>
    </View>}
    <Text style={{fontSize:14,fontWeight:'800',color:t.ink,marginBottom:10}}>{copy(lang,'recentActivity')}</Text>
    {d.recent.length===0?<View style={{backgroundColor:t.card,borderRadius:14,padding:20,alignItems:'center',borderWidth:1,borderColor:t.line}}>
      <Feather name="inbox" size={28} color={t.muted}/><Text style={{fontSize:13,color:t.muted,marginTop:8}}>{copy(lang,'noActivity')}</Text>
    </View>:d.recent.map(s=><View key={s.id} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:12,padding:12,marginBottom:6,borderWidth:1,borderColor:t.line}}>
      <View style={{width:8,height:8,borderRadius:4,backgroundColor:s.status==='published'?'#10B981':s.status==='pending'?'#F59E0B':'#9CA3AF',marginRight:10}}/>
      <View style={{flex:1}}><Text numberOfLines={1} style={{fontSize:13,fontWeight:'700',color:t.ink}}>{s.title}</Text><Text style={{fontSize:10,color:t.muted,marginTop:1}}>{s.views} {copy(lang,'views')}</Text></View>
      <Text style={{fontSize:10,fontWeight:'700',color:s.status==='published'?'#10B981':s.status==='pending'?'#D97706':t.muted}}>{copy(lang,s.status)}</Text>
    </View>)}
  </ScrollView>}

function WriterStories({token,theme:t,lang,categories}:{token:string;theme:Theme;lang:Language;categories:string[]}){
  const[stories,setStories]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState<'all'|'published'|'draft'|'pending'|'rejected'>('all');
  const[showNew,setShowNew]=useState(false);
  const[newTitle,setNewTitle]=useState('');
  const[newDesc,setNewDesc]=useState('');
  const[newCover,setNewCover]=useState('');
  const[newCoverPreview,setNewCoverPreview]=useState('');
  const[newCategory,setNewCategory]=useState('');
  const[catOpen,setCatOpen]=useState(false);
  const[expanded,setExpanded]=useState<string|null>(null);
  const[chapters,setChapters]=useState<any[]>([]);
  const[chTitle,setChTitle]=useState('');
  const[chBody,setChBody]=useState('');
  const[chSaving,setChSaving]=useState(false);
  const[saving,setSaving]=useState(false);
  const[uploadingImg,setUploadingImg]=useState(false);
  const load=()=>{fetchWriterStories(token).then(s=>setStories(s||[])).finally(()=>setLoading(false))};
  useEffect(()=>{load()},[token]);
  const filtered=filter==='all'?stories:stories.filter(s=>s.status===filter);
  const statusColor=(s:string)=>s==='published'?'#10B981':s==='pending'?'#F59E0B':s==='rejected'?'#EF4444':'#9CA3AF';
  const pickCover=async()=>{setUploadingImg(true);const url=await pickAndResizeImage('cover');if(url){setNewCover(url);setNewCoverPreview(url)}setUploadingImg(false)};
  const handleCreate=async()=>{
    if(!newTitle.trim())return;setSaving(true);
    const r=await createWriterStory(token,newTitle.trim(),newDesc.trim(),newCategory||(categories[0]||''),newCover||undefined);
    if(r){setStories(s=>[r,...s]);setShowNew(false);setNewTitle('');setNewDesc('');setNewCover('');setNewCoverPreview('');setNewCategory('')}
    setSaving(false);
  };
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
  const handleDelete=async(id:string)=>{Alert.alert('',copy(lang,'cancel')+'?',[{text:copy(lang,'cancel'),style:'cancel'},{text:copy(lang,'delete'),style:'destructive',onPress:async()=>{await deleteWriterStory(token,id);load()}}])};
  return <View style={{flex:1}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
      <Text style={{fontSize:16,fontWeight:'900',color:t.ink}}>{copy(lang,'myStories')} ({stories.length})</Text>
      <Pressable onPress={()=>setShowNew(!showNew)} style={{backgroundColor:t.primary,borderRadius:10,paddingHorizontal:12,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:5}}>
        <Feather name={showNew?'x':'plus'} size={14} color="#fff"/>
        <Text style={{color:'#fff',fontWeight:'800',fontSize:12}}>{showNew?copy(lang,'cancel'):copy(lang,'newStory')}</Text>
      </Pressable>
    </View>
    <View style={{flexDirection:'row',gap:5,marginBottom:14}}>
      {(['all','published','draft','pending','rejected'] as const).map(f=><Pressable key={f} onPress={()=>setFilter(f)} style={{paddingHorizontal:10,paddingVertical:5,borderRadius:8,backgroundColor:filter===f?t.primary:t.card,borderWidth:1,borderColor:filter===f?t.primary:t.line}}>
        <Text style={{fontSize:11,fontWeight:'700',color:filter===f?'#fff':t.muted}}>{copy(lang,f)}</Text>
      </Pressable>)}
    </View>
    {showNew&&<View style={{backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:t.line}}>
      <TextInput value={newTitle} onChangeText={setNewTitle} placeholder={copy(lang,'storyTitle')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:15,fontWeight:'700',marginBottom:10,borderBottomWidth:1,borderBottomColor:t.line,paddingBottom:8}}/>
      <TextInput value={newDesc} onChangeText={setNewDesc} multiline placeholder={copy(lang,'description')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:13,marginBottom:10,minHeight:50,textAlignVertical:'top'}}/>
      <Pressable onPress={pickCover} disabled={uploadingImg} style={{backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,borderStyle:'dashed',padding:uploadingImg?16:12,marginBottom:10,alignItems:'center'}}>
        {uploadingImg?<ActivityIndicator size="small" color={t.primary}/>:
        newCoverPreview?<View style={{flexDirection:'row',alignItems:'center',gap:10}}><Image source={{uri:newCoverPreview}} style={{width:60,height:45,borderRadius:8}}/><View style={{flex:1}}><Text style={{fontSize:12,fontWeight:'700',color:t.ink}}>{copy(lang,'changePhoto')}</Text><Text style={{fontSize:10,color:t.muted,marginTop:2}}>{copy(lang,'tapToUpload')}</Text></View><Feather name="refresh-cw" size={14} color={t.muted}/></View>:
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Feather name="image" size={18} color={t.muted}/><Text style={{fontSize:12,color:t.muted,fontWeight:'600'}}>{copy(lang,'tapToUpload')}</Text></View>}
      </Pressable>
      <View style={{marginBottom:12}}>
        <Pressable onPress={()=>setCatOpen(!catOpen)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:catOpen?t.primary:t.line,borderRadius:8,padding:10,backgroundColor:t.bg}}>
          <Text style={{fontSize:12,fontWeight:'600',color:newCategory?t.ink:t.muted}}>{newCategory||copy(lang,'selectCategory')}</Text>
          <Feather name={catOpen?'chevron-up':'chevron-down'} size={16} color={t.muted}/>
        </Pressable>
        {catOpen&&<View style={{marginTop:6,borderWidth:1,borderColor:t.line,borderRadius:8,backgroundColor:t.card,maxHeight:160,overflow:'hidden'}}>
          <ScrollView nestedScrollEnabled style={{maxHeight:160}}>
            {categories.map(c=><Pressable key={c} onPress={()=>{setNewCategory(c);setCatOpen(false)}} style={{paddingHorizontal:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:t.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <Text style={{fontSize:12,fontWeight:newCategory===c?'800':'500',color:newCategory===c?t.primary:t.ink}}>{c}</Text>
              {newCategory===c&&<Feather name="check" size={14} color={t.primary}/>}
            </Pressable>)}
          </ScrollView>
        </View>}
      </View>
      <Pressable disabled={saving||!newTitle.trim()} onPress={handleCreate} style={{backgroundColor:t.primary,borderRadius:10,paddingVertical:10,alignItems:'center',opacity:saving||!newTitle.trim()?0.5:1}}>
        {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={{color:'#fff',fontWeight:'800',fontSize:13}}>{copy(lang,'create')}</Text>}
      </Pressable>
    </View>}
    {loading?<View style={{alignItems:'center',paddingVertical:40}}><ActivityIndicator color={t.primary}/></View>:
    filtered.length===0?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="book" size={28} color={t.muted}/><Text style={{fontSize:13,color:t.muted,marginTop:8}}>{copy(lang,'noStories')}</Text></View>:
    filtered.map(s=><View key={s.id} style={{backgroundColor:t.card,borderRadius:14,padding:14,marginBottom:8,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
        {s.cover_url?<Image source={{uri:s.cover_url}} style={{width:44,height:34,borderRadius:6,marginRight:10}}/>:
        <View style={{width:44,height:34,borderRadius:6,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:10}}><Feather name="book-open" size={14} color={t.muted}/></View>}
        <View style={{width:8,height:8,borderRadius:4,backgroundColor:statusColor(s.status),marginRight:8}}/>
        <Text numberOfLines={1} style={{flex:1,fontSize:14,fontWeight:'800',color:t.ink}}>{s.title}</Text>
        <View style={{paddingHorizontal:8,paddingVertical:3,borderRadius:6,backgroundColor:statusColor(s.status)+'18'}}>
          <Text style={{fontSize:10,fontWeight:'700',color:statusColor(s.status)}}>{copy(lang,s.status)}</Text>
        </View>
      </View>
      {s.description?<Text numberOfLines={2} style={{fontSize:12,color:t.muted,marginBottom:8}}>{s.description}</Text>:null}
      <View style={{flexDirection:'row',gap:6}}>
        {s.status==='draft'&&<Pressable onPress={()=>handleSubmit(s.id)} style={{flex:1,backgroundColor:'#FEF3C7',borderRadius:8,paddingVertical:7,alignItems:'center'}}>
          <Text style={{fontSize:11,fontWeight:'700',color:'#D97706'}}>{copy(lang,'submitReview')}</Text>
        </Pressable>}
        {s.status==='rejected'&&<Pressable onPress={()=>handleSubmit(s.id)} style={{flex:1,backgroundColor:'#FEE2E2',borderRadius:8,paddingVertical:7,alignItems:'center'}}>
          <Text style={{fontSize:11,fontWeight:'700',color:'#EF4444'}}>{copy(lang,'submitReview')}</Text>
        </Pressable>}
        <Pressable onPress={()=>toggleExpand(s.id)} style={{width:32,height:32,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:6}}>
          <Feather name="book-open" size={14} color={expanded===s.id?t.primary:t.muted}/>
        </Pressable>
        <Pressable onPress={()=>handleDelete(s.id)} style={{width:32,height:32,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
          <Feather name="trash-2" size={14} color={t.muted}/>
        </Pressable>
      </View>
      {s.review_note&&<View style={{marginTop:8,backgroundColor:'#FEF2F2',borderRadius:8,padding:8}}>
        <Text style={{fontSize:11,color:'#991B1B',fontWeight:'600'}}>{copy(lang,'reviewNote')}: {s.review_note}</Text>
      </View>}
      {expanded===s.id&&<View style={{marginTop:10,borderTopWidth:1,borderTopColor:t.line,paddingTop:10}}>
        <Text style={{fontSize:12,fontWeight:'800',color:t.ink,marginBottom:6}}>{copy(lang,'chapters')} ({chapters.length})</Text>
        {chapters.map((ch,i)=><View key={ch.id} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:8,padding:8,marginBottom:4}}>
          <View style={{width:22,height:22,borderRadius:11,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:8}}>
            <Text style={{fontSize:10,fontWeight:'800',color:t.primary}}>{i+1}</Text>
          </View>
          <Text numberOfLines={1} style={{flex:1,fontSize:12,fontWeight:'600',color:t.ink}}>{ch.title}</Text>
          <Pressable onPress={()=>removeChapter(s.id,ch.id)}><Feather name="x" size={15} color={t.muted}/></Pressable>
        </View>)}
        <TextInput value={chTitle} onChangeText={setChTitle} placeholder={copy(lang,'chapterTitle')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:13,fontWeight:'700',marginTop:8,borderBottomWidth:1,borderBottomColor:t.line,paddingBottom:6}}/>
        <TextInput value={chBody} onChangeText={setChBody} multiline placeholder={copy(lang,'chapterBody')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:12,marginTop:8,minHeight:60,textAlignVertical:'top'}}/>
        <Pressable disabled={chSaving||!chTitle.trim()} onPress={()=>addChapter(s.id)} style={{backgroundColor:t.primary,borderRadius:8,paddingVertical:8,alignItems:'center',marginTop:8,opacity:chSaving||!chTitle.trim()?0.5:1}}>
          {chSaving?<ActivityIndicator color="#fff" size="small"/>:<Text style={{color:'#fff',fontWeight:'800',fontSize:12}}>{copy(lang,'addChapter')}</Text>}
        </Pressable>
      </View>}
    </View>)}
  </View>}

function WriterProfileStudio({token,theme:t,writer,lang,onUpdate}:{token:string;theme:Theme;writer:any;lang:Language;onUpdate:(patch:any)=>void}){
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
    const url=await pickAndResizeImage('avatar');
    if(url)setAvatar(url);
    setUploadingImg(false);
  };
  const handleSave=async()=>{
    setSaving(true);setErr('');
    const r=await updateWriterProfile(token,{writer_name:name.trim(),bio:bio.trim(),avatar_url:avatar||undefined,username:username.trim()||undefined});
    setSaving(false);
    if(r.ok){setSaved(true);onUpdate({writer_name:name.trim(),bio:bio.trim(),avatar_url:avatar||undefined,username:username.trim()||undefined});setTimeout(()=>setSaved(false),2000)}
    else setErr(r.error==='Username already taken'?copy(lang,'usernameTaken'):r.error||'');
  };
  return <ScrollView showsVerticalScrollIndicator={false}>
    <View style={{alignItems:'center',marginBottom:20}}>
      <Pressable onPress={handlePickAvatar} disabled={uploadingImg} style={{marginBottom:10}}>
        {uploadingImg?<View style={{width:80,height:80,borderRadius:40,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}><ActivityIndicator size="small" color={t.primary}/></View>:
        avatar?<View><Image source={{uri:avatar}} style={{width:80,height:80,borderRadius:40}}/><View style={{position:'absolute',bottom:0,right:0,backgroundColor:t.primary,borderRadius:12,width:26,height:26,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:t.card}}><Feather name="camera" size={12} color="#fff"/></View></View>:
        <View style={{width:80,height:80,borderRadius:40,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',elevation:4,shadowColor:t.primary,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:8}}>
          <Text style={{fontSize:28,fontWeight:'900',color:'#fff'}}>{writer?.writer_name?.[0]?.toUpperCase()||'?'}</Text>
          <View style={{position:'absolute',bottom:0,backgroundColor:'rgba(0,0,0,0.4)',borderRadius:12,width:26,height:26,alignItems:'center',justifyContent:'center'}}><Feather name="camera" size={12} color="#fff"/></View>
        </View>}
      </Pressable>
      <Text style={{fontSize:18,fontWeight:'900',color:t.ink}}>{name||writer?.writer_name}</Text>
      <Text style={{fontSize:12,color:t.muted,marginTop:2}}>@{username||writer?.username}</Text>
    </View>
    <View style={{backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:t.line}}>
      <Text style={{fontSize:11,fontWeight:'800',color:t.muted,marginBottom:12,letterSpacing:0.5}}>{copy(lang,'editProfile')}</Text>
      <View style={{marginBottom:12}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'username')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,paddingHorizontal:12,height:44}}>
          <Feather name="at-sign" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:14,fontWeight:'600'}}/>
        </View>
      </View>
      <View style={{marginBottom:12}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'writerName')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,paddingHorizontal:12,height:44}}>
          <Feather name="user" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={name} onChangeText={setName} style={{flex:1,color:t.ink,fontSize:14,fontWeight:'600'}}/>
        </View>
      </View>
      <View style={{marginBottom:16}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'bio')}</Text>
        <View style={{backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,padding:12,minHeight:80}}>
          <TextInput value={bio} onChangeText={setBio} multiline placeholder={copy(lang,'bioPlaceholder')} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:14,fontWeight:'500',lineHeight:20}}/>
        </View>
      </View>
      {err?<View style={{backgroundColor:'#FEF2F2',borderRadius:10,padding:10,marginBottom:12,flexDirection:'row',alignItems:'center',gap:6}}><Feather name="alert-circle" size={14} color="#EF4444"/><Text style={{fontSize:12,fontWeight:'600',color:'#EF4444',flex:1}}>{err}</Text></View>:null}
      <Pressable disabled={saving} onPress={handleSave} style={{backgroundColor:saved?'#10B981':t.primary,borderRadius:12,paddingVertical:12,alignItems:'center'}}>
        {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={{color:'#fff',fontWeight:'800',fontSize:14}}>{saved?'✓ '+copy(lang,'saved'):copy(lang,'save')}</Text>}
      </Pressable>
    </View>
  </ScrollView>}

function WriterNotifs({token,theme:t,lang}:{token:string;theme:Theme;lang:Language}){
  const[notifs,setNotifs]=useState<{id:string;title:string;body:string;type:string;is_read:boolean;url?:string;created_at:string}[]>([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{fetchWriterNotifications(token).then(n=>setNotifs(n||[])).finally(()=>setLoading(false))},[token]);
  const markAll=async()=>{await markWriterNotificationsRead(token);setNotifs(n=>n.map(x=>({...x,is_read:true})))};
  const deleteNotif=async(id:string)=>{await deleteWriterNotification(token,id);setNotifs(n=>n.filter(x=>x.id!==id))};
  const typeIcon=(type:string)=>type==='approved'?'check-circle':type==='rejected'?'x-circle':type==='info'?'info':'bell';
  const typeColor=(type:string)=>type==='approved'?'#10B981':type==='rejected'?'#EF4444':'#6366F1';
  return <View style={{flex:1}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <Text style={{fontSize:16,fontWeight:'900',color:t.ink}}>{copy(lang,'notifications')}</Text>
      <View style={{flexDirection:'row',gap:8}}>
        {notifs.some(n=>!n.is_read)&&<Pressable onPress={markAll} style={{paddingHorizontal:10,paddingVertical:5,borderRadius:8,backgroundColor:t.tint}}>
          <Text style={{fontSize:11,fontWeight:'700',color:t.primary}}>{copy(lang,'markAllRead')}</Text>
        </Pressable>}
        {notifs.length>0&&<Pressable onPress={async()=>{const ids=notifs.map(n=>n.id);setNotifs([]);await Promise.all(ids.map(id=>deleteWriterNotification(token,id)))}} style={{paddingHorizontal:5,paddingVertical:5,borderRadius:8,backgroundColor:t.tint}}>
          <Feather name="trash-2" size={13} color="#EF4444"/>
        </Pressable>}
      </View>
    </View>
    {loading?<View style={{alignItems:'center',paddingVertical:40}}><ActivityIndicator color={t.primary}/></View>:
    notifs.length===0?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="bell" size={28} color={t.muted}/><Text style={{fontSize:13,color:t.muted,marginTop:8}}>{copy(lang,'noNotifications')}</Text></View>:
    notifs.map(n=><View key={n.id} style={{flexDirection:'row',alignItems:'flex-start',backgroundColor:n.is_read?t.card:t.tint,borderRadius:12,padding:12,marginBottom:6,borderWidth:1,borderColor:n.is_read?t.line:t.primary+'30',borderLeftWidth:3,borderLeftColor:typeColor(n.type)}}>
      <View style={{width:30,height:30,borderRadius:8,backgroundColor:typeColor(n.type)+'18',alignItems:'center',justifyContent:'center',marginRight:10}}>
        <Feather name={typeIcon(n.type) as any} size={14} color={typeColor(n.type)}/>
      </View>
      <View style={{flex:1}}>
        <Text numberOfLines={1} style={{fontSize:13,fontWeight:'700',color:t.ink}}>{n.title}</Text>
        <Text numberOfLines={3} style={{fontSize:12,color:t.muted,marginTop:2,lineHeight:17}}>{n.body}</Text>
        <View style={{flexDirection:'row',alignItems:'center',marginTop:4}}>
          {n.url?<Pressable onPress={()=>Linking.openURL(n.url!)} style={{flexDirection:'row',alignItems:'center',marginRight:10,backgroundColor:t.primary+'15',paddingHorizontal:10,paddingVertical:5,borderRadius:8}}>
            <Feather name="external-link" size={12} color={t.primary}/>
            <Text style={{fontSize:11,fontWeight:'700',color:t.primary,marginLeft:5}}>{copy(lang,'openLink')}</Text>
          </Pressable>:null}
          <Text style={{fontSize:10,color:t.muted}}>{new Date(n.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      {!n.is_read&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:t.primary,marginLeft:8,marginTop:4}}/>}
      <Pressable onPress={()=>deleteNotif(n.id)} style={{marginLeft:8,marginTop:2}}>
        <Feather name="x" size={16} color={t.muted}/>
      </Pressable>
    </View>)}
  </View>}

function Back({title,theme,onPress}:{title:string;theme:Theme;onPress:()=>void}){return <View style={styles.back}><Pressable onPress={onPress}><Feather name="arrow-left" size={22} color={theme.ink}/></Pressable><Text style={[styles.backTitle,{color:theme.ink}]}>{title}</Text><View style={{width:22}}/></View>}
function Section({title,theme,action,seeAllText}:{title:string;theme:Theme;action?:()=>void;seeAllText?:string}){return <View style={styles.section}><Text style={[styles.sectionTitle,{color:theme.ink}]}>{title}</Text>{action&&<Pressable onPress={action}><Text style={{color:theme.primary,fontWeight:'800',fontSize:12}}>{seeAllText||'See all →'}</Text></Pressable>}</View>}
function Cover({book,large}:{book:Book;large?:boolean}){return <View style={[styles.cover,large&&styles.coverLarge,{backgroundColor:book.color}]}>{book.cover_url?<><Image source={{uri:book.cover_url}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:large?16:9}} resizeMode="cover"/><View style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:large?16:9,backgroundColor:'rgba(0,0,0,0.15)'}}/></>:null}<Feather name={I(book.categoryIcon)} size={large?27:20} color={book.accent}/><Text numberOfLines={3} style={[styles.coverTitle,large&&{fontSize:17}]}>{book.title}</Text><View style={{height:2,width:24,backgroundColor:book.accent,marginVertical:7}}/><Text style={styles.coverAuthor}>{book.author}</Text></View>}
function Episode({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){const c=book.chapters[book.chapters.length-1];return <Pressable onPress={onPress} style={[styles.episode,{backgroundColor:theme.card,borderColor:theme.line}]}><Cover book={book}/><View style={{flex:1}}><Text style={{color:theme.primary,fontSize:10,fontWeight:'900'}}>নতুন পর্ব</Text><Text style={[styles.rowTitle,{color:theme.ink}]}>{book.title}</Text><Text style={{color:theme.muted,fontSize:11,marginTop:4}}>পর্ব {book.chapters.length}: {c?.title||'—'}</Text></View><Feather name="play-circle" size={23} color={theme.primary}/></Pressable>}
function Featured(props: C & { list?: Book[] }){const p=props as C;const {width}=useWindowDimensions();const W=width-36;const items=(props.list&&props.list.length?props.list:p.allBooks.slice(0,6));const N=items.length;const anim=useRef(new Animated.Value(0)).current;const idxRef=useRef(0);const[idx,setIdx]=useState(0);const setter=(i:number)=>{idxRef.current=((i%N)+N)%N;setIdx(idxRef.current)};useEffect(()=>{Animated.timing(anim,{toValue:-idx*W,duration:450,useNativeDriver:true}).start()},[idx,anim,W]);useEffect(()=>{if(N<2)return;const id=setInterval(()=>setter(idxRef.current+1),4000);return()=>clearInterval(id)},[N,setter]);const pan=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>N>1,onPanResponderRelease:(_,g)=>{if(N<2)return;if(g.dx<-50)setter(idxRef.current+1);else if(g.dx>50)setter(idxRef.current-1)}})).current;if(!N)return null;return <View><View style={{overflow:'hidden',borderRadius:24}}><Animated.View style={{flexDirection:'row',width:W*N,transform:[{translateX:anim}]}} {...pan.panHandlers}>{items.map((b,i)=><View key={b.id} style={{width:W}}><FeaturedCard book={b} p={p} rank={i}/></View>)}</Animated.View></View><View style={{flexDirection:'row',justifyContent:'center',gap:6,marginTop:12}}>{items.map((_,i)=>{const on=i===idx;return <View key={i} style={[styles.dot,{width:on?18:6,backgroundColor:on?p.theme.primary:p.theme.line}]}/>})}</View></View>}
function shade(hex:string,amt:number):string{const h=hex.replace('#','');if(h.length!==6)return hex;const n=parseInt(h,16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;const t=amt<0?0:255;const q=Math.abs(amt)/100;r=Math.round((t-r)*q+r);g=Math.round((t-g)*q+g);b=Math.round((t-b)*q+b);const z=(x:number)=>('0'+x.toString(16)).slice(-2);return '#'+z(r)+z(g)+z(b)}
function FeaturedCard({book,p,rank}:{book:Book;p:C;rank:number}){const base=book.color||'#123E39';const accent=book.accent||'#F5C660';const dark=shade(base,-32);const isBm=p.state.bookmarks.includes(book.id);const open=()=>p.open(book.id);const toggleBm=()=>p.update({bookmarks:isBm?p.state.bookmarks.filter(x=>x!==book.id):[...p.state.bookmarks,book.id]});const metaW=book.views_visible!==false;const readLabel=p.state.settings.language==='hi'?'पढ़ें':p.state.settings.language==='en'?'Read':'পড়ুন';return <View style={[featStyles.card,{backgroundColor:base}]}><LinearGradient colors={[base,dark]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/><Svg style={StyleSheet.absoluteFill} pointerEvents="none"><Circle cx="92%" cy={18} r={92} fill={accent+'26'}/><Circle cx="-14" cy={205} r={118} fill="#ffffff10"/><Ellipse cx="34%" cy={262} rx={165} ry={80} fill={accent+'16'}/><Circle cx="70%" cy={248} r={70} fill="#ffffff0c"/></Svg><View style={featStyles.top}><View style={[featStyles.rank,{backgroundColor:accent}]}><Text style={[featStyles.rankText,{color:base}]}>#{rank+1}</Text></View><Pressable onPress={toggleBm} hitSlop={10} style={[featStyles.bm,{borderColor:'#ffffff44'}]}><Feather name="bookmark" size={15} color={isBm?accent:'#fff'}/></Pressable></View><View style={featStyles.row}><View style={featStyles.left}><View style={[featStyles.tag,{backgroundColor:accent+'33'}]}><Text style={[featStyles.tagText,{color:accent}]}>✦ {tr(p,'popular')}</Text></View><Text numberOfLines={2} style={featStyles.title}>{book.title}</Text><Text numberOfLines={1} style={featStyles.author}>{book.author}</Text><View style={featStyles.meta}>{metaW&&<View style={featStyles.metaC}><Feather name="eye" size={10} color="#E7F2EE"/><Text style={featStyles.metaT}>{book.views}</Text></View>}<View style={featStyles.metaC}><Feather name="star" size={10} color={accent}/><Text style={featStyles.metaT}>{book.rating}</Text></View><View style={featStyles.metaC}><Feather name={I(book.categoryIcon)} size={10} color="#E7F2EE"/><Text style={featStyles.metaT} numberOfLines={1}>{book.category}</Text></View></View><Pressable onPress={open} style={[featStyles.btn,{backgroundColor:accent}]}><Feather name="book-open" size={12} color={base}/><Text style={[featStyles.btnText,{color:base}]}>{readLabel}</Text></Pressable></View><Pressable onPress={open} style={featStyles.coverWrap}>{book.cover_url?<Image source={{uri:book.cover_url}} style={featStyles.coverImg}/>:<View style={[featStyles.coverImg,{backgroundColor:book.color}]}><Feather name={I(book.categoryIcon)} size={30} color={book.accent}/></View>}</Pressable></View></View>}
function BookCard({book,theme,lang,rank,accent,onPress}:{book:Book;theme:Theme;lang:Language;rank?:number;accent?:string;onPress:()=>void}){const newBadge=Boolean(book.isNew);return <Pressable onPress={onPress} style={{width:130}}><View style={{position:'relative'}}><Cover book={book}/>{typeof rank==='number'?<View style={[styles.rankBadge,{backgroundColor:rank===0?accent:rank===1?accent:rank<3?(accent||'#888')+'DD':'#555555DD'}]}><Text style={[styles.rankBadgeText,{color:rank<2?'#fff':'#fff'}]}>{rank+1}</Text></View>:<View style={[styles.statusBadge,{backgroundColor:newBadge?theme.primary:theme.tint}]}><Text style={[styles.statusBadgeText,{color:newBadge?'#fff':theme.primary}]}>{newBadge?copy(lang,'statusNew'):copy(lang,'statusOngoing')}</Text></View>}{book.views_visible !== false && <View style={styles.viewBadge}><Feather name="eye" size={10} color="#fff"/><Text style={styles.viewBadgeText}>{book.views}</Text></View>}</View><Text numberOfLines={2} style={[styles.bookName,{color:theme.ink}]}>{book.title}</Text><Text numberOfLines={1} style={{color:theme.muted,fontSize:11}}>{book.author}</Text></Pressable>}
function BadgeIcon({badge,size}:{badge?:string;size?:number}){
  if(!badge||badge==='none')return null;
  const s=size||18;
  if(badge==='verified')return <Image source={require('./assets/verified-badge.png')} style={{width:s,height:s}}/>;
  if(badge==='popular')return <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M22.5 12.5c0-1.58-1.2-2.87-2.75-3.02C19.36 6.72 18.18 4.14 15.96 2.71 13.74 1.28 10.99 1.35 8.79 2.88 6.59 4.41 5.55 7.19 6.14 9.87 4.28 10.36 2.82 11.97 2.5 14c-.32 2.03.66 4.09 2.44 5.22 1.78 1.13 4.07 1.18 5.9.16.43.95 1.18 1.77 2.16 2.33.98.56 2.14.84 3.3.84 1.58 0 3.07-.6 4.21-1.7 1.14-1.1 1.77-2.59 1.77-4.17 0-.29-.04-.57-.11-.85.99-.78 1.7-1.94 1.88-3.28.18-1.34-.32-2.72-1.36-3.73z" fill="#800020"/><Path d="M10 15.5l-3.5-3.5 1.41-1.41L10 12.67l5.09-5.09 1.41 1.41L10 15.5z" fill="#fff"/></Svg>;
  if(badge==='top')return <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M12 2l2.4 2.4L18 3.2l.8 3.6 3.2 1.6-1.6 3.2L22 15l-3.2 1.6-.8 3.6-3.6-.8L12 22l-2.4-2.4L6 20.8l-.8-3.6L2 15.6l1.6-3.2L2 9l3.2-1.6.8-3.6L10.4 4.4z" fill="#1B5E20"/><Path d="M8 12.5l2.5 2.5L16 9.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
  return null;
}
function AuthorCard({writer,theme,lang,onPress,bookCount}:{writer:import('./src/types').WriterProfile;theme:Theme;lang:Language;onPress:()=>void;bookCount:number}){
  const bg=theme.tint;const ring=theme.primary;
  return <Pressable onPress={onPress} style={[dStyles.writerCard,{backgroundColor:theme.card,borderColor:theme.line}]}>
    <View style={[dStyles.writerCardBg,{backgroundColor:bg}]}/>
    <View style={dStyles.writerAvatarWrap}>
      <View style={[dStyles.writerAvatar,{borderColor:theme.card,backgroundColor:bg}]}>
        {writer.avatar_url?<Image source={{uri:writer.avatar_url}} style={StyleSheet.absoluteFill}/>:<Text style={{fontSize:28,fontWeight:'900',color:ring}}>{writer.writer_name[0]?.toUpperCase()||'?'}</Text>}
      </View>
    </View>
    <View style={dStyles.writerCardBody}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4}}>
        <Text numberOfLines={1} style={[dStyles.writerName,{color:theme.ink}]}>{writer.writer_name}</Text>
        <BadgeIcon badge={writer.badge} size={15}/>
      </View>
      <Text numberOfLines={1} style={[dStyles.writerUsername,{color:theme.muted}]}>@{writer.username}</Text>
      <View style={[dStyles.writerStatsRow,{borderColor:theme.line}]}>
        <View style={dStyles.writerStat}><Feather name="book-open" size={12} color={theme.primary}/><Text style={[dStyles.writerStatNum,{color:theme.ink}]}>{bookCount}</Text><Text style={[dStyles.writerStatLabel,{color:theme.muted}]}>{copy(lang,'books')}</Text></View>
        <View style={dStyles.writerStat}><Feather name="users" size={12} color={theme.primary}/><Text style={[dStyles.writerStatNum,{color:theme.ink}]}>{writer.follower_count||0}</Text><Text style={[dStyles.writerStatLabel,{color:theme.muted}]}>{copy(lang,'followers')}</Text></View>
      </View>
    </View>
  </Pressable>}
function Row({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.row,{backgroundColor:theme.card,borderColor:theme.line}]}><Cover book={book}/><View style={{flex:1}}><Text style={[styles.rowTitle,{color:theme.ink}]}>{book.title}</Text><Text style={{color:theme.primary,fontSize:12,marginTop:4}}>{book.author}</Text><View style={{flexDirection:'row',alignItems:'center',gap:3}}><Feather name="eye" size={12} color={theme.muted}/><Text style={{color:theme.muted,fontSize:11}}>{book.views_visible !== false ? `${book.views} • ${book.category}` : book.category}</Text></View></View><Feather name="chevron-right" size={18} color={theme.muted}/></Pressable>}
function Link({title,icon,n,theme,onPress}:{title:string;icon:string;n:number;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.link,{backgroundColor:theme.card,borderColor:theme.line}]}><View style={[styles.linkIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={20} color={theme.primary}/></View><Text style={[styles.rowTitle,{color:theme.ink}]}>{title}</Text><Text style={{color:theme.muted,fontSize:10}}>{n}টি</Text></Pressable>}
function Menu({title,icon,theme,onPress}:{title:string;icon:string;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.menu,{backgroundColor:theme.card,borderBottomColor:theme.line}]}><View style={[styles.menuIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={17} color={theme.primary}/></View><Text style={[styles.rowTitle,{color:theme.ink,flex:1}]}>{title}</Text><Feather name="chevron-right" size={18} color={theme.muted}/></Pressable>}
function Toggle({title,icon,value,theme,onChange}:{title:string;icon:string;value:boolean;theme:Theme;onChange:(v:boolean)=>void}){return <View style={[styles.menu,{backgroundColor:theme.card,borderBottomColor:theme.line}]}><View style={[styles.menuIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={17} color={theme.primary}/></View><Text style={[styles.rowTitle,{color:theme.ink,flex:1}]}>{title}</Text><Switch value={value} onValueChange={onChange} trackColor={{true:theme.primary}}/></View>}
function Action({icon,label,active,theme,onPress}:{icon:string;label:string;active:boolean;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={{alignItems:'center',gap:5}}><View style={[styles.action,{backgroundColor:active?theme.primary:theme.card,borderColor:theme.line}]}><Feather name={I(icon)} size={17} color={active?'#fff':theme.ink}/></View><Text style={{color:active?theme.primary:theme.muted,fontSize:10,fontWeight:'800'}}>{label}</Text></Pressable>}
function Button({title,icon,disabled,onPress}:{title:string;icon:string;disabled?:boolean;onPress:()=>void}){return <Pressable disabled={disabled} onPress={onPress} style={[styles.button,disabled&&{opacity:.4}]}><Text style={styles.buttonText}>{title}</Text><Feather name={I(icon)} size={18} color="#fff"/></Pressable>}
function Empty({theme}:{theme:Theme}){return <View style={styles.empty}><Feather name="book" size={28} color={theme.primary}/><Text style={[styles.rowTitle,{color:theme.ink,marginTop:10}]}>এখানে এখনো কিছু নেই</Text><Text style={{color:theme.muted,marginTop:5}}>গল্প পড়তে শুরু করুন</Text></View>}
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
type ThemeId = import('./src/types').ThemeId;
const themePalettes:Record<ThemeId,{light:{dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string};dark:{dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string}}>={
katagolap:{light:{dark:false,primary:'#087A63',bg:'#F5FAF8',card:'#FFFFFF',ink:'#172421',muted:'#71817D',line:'#E2ECE8',tint:'#DDF5EC',reader:'#FBFCF7'},dark:{dark:true,primary:'#59C9AA',bg:'#0E1514',card:'#17211F',ink:'#F1F6F4',muted:'#91A39E',line:'#293834',tint:'#203D36',reader:'#111917'}},
sepia:{light:{dark:false,primary:'#8B6914',bg:'#FBF7F0',card:'#FFFFFF',ink:'#2C2416',muted:'#8C7E6A',line:'#E8DFD0',tint:'#F3EDE0',reader:'#FDFBF7'},dark:{dark:true,primary:'#D4A843',bg:'#1A1508',card:'#241E12',ink:'#F0E8D8',muted:'#9A8B6E',line:'#3A3220',tint:'#2E2714',reader:'#16120A'}},
midnight:{light:{dark:false,primary:'#4A6CF7',bg:'#F4F6FF',card:'#FFFFFF',ink:'#1A1F36',muted:'#6B7394',line:'#D8DDF0',tint:'#E4E8F8',reader:'#FAFBFF'},dark:{dark:true,primary:'#7B96FF',bg:'#0B0E1A',card:'#151A2E',ink:'#E8ECFF',muted:'#6B7394',line:'#262D4A',tint:'#1C2240',reader:'#0D1020'}},
godhuli:{light:{dark:false,primary:'#C05621',bg:'#FFF8F3',card:'#FFFFFF',ink:'#2D1B0E',muted:'#8C6E56',line:'#EDD8C8',tint:'#F8EDE2',reader:'#FFFCF9'},dark:{dark:true,primary:'#ED8936',bg:'#1A0F06',card:'#261A0E',ink:'#F8E8D8',muted:'#9A7E60',line:'#3A2E1E',tint:'#2E2214',reader:'#160E08'}},
sagar:{light:{dark:false,primary:'#1A7FA0',bg:'#F2FAFD',card:'#FFFFFF',ink:'#0F2B33',muted:'#5C8A96',line:'#C8E2EA',tint:'#D8EFF5',reader:'#F8FCFD'},dark:{dark:true,primary:'#38B2D6',bg:'#061218',card:'#0E1E24',ink:'#D8F0F8',muted:'#5C8A96',line:'#1E3440',tint:'#142A32',reader:'#081418'}},
oronno:{light:{dark:false,primary:'#2D7A3A',bg:'#F3FAF4',card:'#FFFFFF',ink:'#1A2E1E',muted:'#5C7A60',line:'#C8E4CC',tint:'#D8F0DA',reader:'#F8FCF9'},dark:{dark:true,primary:'#4CAF5A',bg:'#0A1A0C',card:'#142816',ink:'#D8F0DC',muted:'#5C7A60',line:'#1E3420',tint:'#162C18',reader:'#0C1C0E'}},
lavender:{light:{dark:false,primary:'#7C3AED',bg:'#F8F5FF',card:'#FFFFFF',ink:'#1E1533',muted:'#7C6E94',line:'#DDD4F0',tint:'#ECE6F8',reader:'#FCFAFF'},dark:{dark:true,primary:'#A78BFA',bg:'#120E1E',card:'#1C1530',ink:'#EDE6FF',muted:'#7C6E94',line:'#302848',tint:'#241E3C',reader:'#141020'}},
golapi:{light:{dark:false,primary:'#D94A7A',bg:'#FFF5F8',card:'#FFFFFF',ink:'#2E1520',muted:'#8C5E72',line:'#F0D0DC',tint:'#F8E2EA',reader:'#FFFAFC'},dark:{dark:true,primary:'#F472B6',bg:'#1A0C12',card:'#281520',ink:'#FFE8F0',muted:'#8C5E72',line:'#3E2430',tint:'#301C28',reader:'#1C0E14'}},
  shapla:{light:{dark:false,primary:'#0E9AA7',bg:'#F0FBFD',card:'#FFFFFF',ink:'#0E2A2E',muted:'#5C848C',line:'#C8E8EC',tint:'#D9F2F5',reader:'#F6FCFD'},dark:{dark:true,primary:'#2EC4C9',bg:'#071A1D',card:'#0F282C',ink:'#DCF5F7',muted:'#5C848C',line:'#1E3E42',tint:'#133235',reader:'#091B1E'}},
  golap:{light:{dark:false,primary:'#E63946',bg:'#FFF6F7',card:'#FFFFFF',ink:'#3A1520',muted:'#99505C',line:'#F0CCD2',tint:'#F9E3E7',reader:'#FFFBFC'},dark:{dark:true,primary:'#FF6B7A',bg:'#20090F',card:'#33121C',ink:'#FFE7EC',muted:'#99505C',line:'#4A1E28',tint:'#3A1620',reader:'#220B11'}}};
function themeFor(themeId:ThemeId,dark:boolean){return themePalettes[themeId]?.[dark?'dark':'light']||themePalettes.katagolap[dark?'dark':'light']}
const styles=StyleSheet.create({center:{flex:1,alignItems:'center',justifyContent:'center'},logo:{width:76,height:76,borderRadius:25,backgroundColor:'#087A63',alignItems:'center',justifyContent:'center',elevation:8},brand:{fontSize:25,fontWeight:'900',marginTop:16},gate:{flex:1},art:{height:'38%',backgroundColor:'#DDF8EF',alignItems:'center',justifyContent:'center'},gateBody:{flex:1,padding:25,justifyContent:'center'},eyebrow:{fontSize:12,fontWeight:'900',letterSpacing:1},gateTitle:{fontSize:30,lineHeight:39,fontWeight:'900',marginTop:8},copy:{fontSize:14,lineHeight:22,marginVertical:14},input:{height:55,borderWidth:1,borderRadius:17,paddingHorizontal:16,fontSize:16},note:{textAlign:'center',fontSize:11,marginTop:14},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:23},title:{fontSize:25,fontWeight:'900'},feature:{height:214,borderRadius:24,padding:18,flexDirection:'row',alignItems:'center',overflow:'hidden'},tag:{color:'#F7D87D',fontSize:11,fontWeight:'900',marginBottom:10},featureTitle:{color:'#fff',fontSize:23,lineHeight:30,fontWeight:'900'},featureAuthor:{color:'#D1E6DF',fontSize:12,marginTop:5},readPill:{backgroundColor:'#F5D578',borderRadius:11,padding:11,alignSelf:'flex-start',marginTop:15},cover:{width:124,height:169,borderRadius:9,padding:11,justifyContent:'flex-end',overflow:'hidden'},coverLarge:{width:137,height:188,transform:[{rotate:'2deg'}]},coverTitle:{color:'#fff',fontWeight:'900',fontSize:14,lineHeight:18},coverAuthor:{fontSize:8,color:'#FFFFFFAA'},featureCard:{height:214,borderRadius:24,padding:18,flexDirection:'row',alignItems:'center',overflow:'hidden'},featTag:{color:'#F7D87D',fontSize:11,fontWeight:'900',marginBottom:8},featTitle:{color:'#fff',fontSize:21,lineHeight:28,fontWeight:'900'},featAuthor:{color:'#D1E6DF',fontSize:12,marginTop:4},featDesc:{color:'#D1E6DF',fontSize:11,lineHeight:16,marginTop:8},featBtn:{backgroundColor:'#F5D578',borderRadius:11,paddingVertical:9,paddingHorizontal:13,alignSelf:'flex-start',marginTop:12},featBtnText:{fontWeight:'900',color:'#173D34',fontSize:12},dot:{height:6,borderRadius:3},statusBadge:{position:'absolute',top:8,left:8,alignSelf:'flex-start',borderRadius:7,paddingVertical:3,paddingHorizontal:7},statusBadgeText:{fontSize:9,fontWeight:'900',letterSpacing:0.5},rankBadge:{position:'absolute',top:-6,left:-6,minWidth:30,height:30,borderRadius:10,alignItems:'center',justifyContent:'center',paddingHorizontal:5,borderWidth:2.5,borderColor:'#fff'},rankBadgeText:{fontSize:15,fontWeight:'900'},viewBadge:{position:'absolute',bottom:8,right:8,flexDirection:'row',alignItems:'center',gap:3,borderRadius:8,paddingVertical:2.5,paddingHorizontal:6,backgroundColor:'rgba(0,0,0,0.55)'},viewBadgeText:{color:'#fff',fontSize:9,fontWeight:'800'},secHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:27,marginBottom:13},secIcon:{width:28,height:28,borderRadius:9,alignItems:'center',justifyContent:'center'},seeAllPill:{borderRadius:20,paddingVertical:6,paddingHorizontal:12},section:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:27,marginBottom:13},sectionTitle:{fontSize:19,fontWeight:'900'},bookName:{fontSize:14,fontWeight:'800',lineHeight:19,marginTop:9},episode:{minHeight:98,borderRadius:18,borderWidth:1,padding:10,flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},row:{minHeight:100,borderRadius:18,borderWidth:1,padding:10,flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},rowTitle:{fontSize:14,fontWeight:'800'},tabs:{height:76,borderTopWidth:1,flexDirection:'row',paddingTop:9},tab:{flex:1,alignItems:'center',gap:4},grid2:{flexDirection:'row',flexWrap:'wrap',gap:10},link:{width:'48.4%',borderRadius:18,borderWidth:1,padding:13},linkIcon:{width:40,height:40,borderRadius:13,alignItems:'center',justifyContent:'center',marginBottom:12},catGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},catCard:{width:'47%'},catImgWrap:{borderRadius:16,overflow:'hidden',height:140},catImg:{width:'100%',height:140},catImgFallback:{width:'100%',height:140,alignItems:'center',justifyContent:'center'},catImgOverlay:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.35)',paddingVertical:8,paddingHorizontal:10},catImgName:{color:'#fff',fontSize:14,fontWeight:'900'},catBadge:{alignSelf:'flex-start',marginTop:8,borderRadius:8,paddingVertical:4,paddingHorizontal:10},catBadgeText:{fontSize:11,fontWeight:'700'},profile:{padding:15,borderRadius:20,borderWidth:1,flexDirection:'row',alignItems:'center',gap:12},profileName:{fontSize:18,fontWeight:'900'},group:{fontSize:11,fontWeight:'900',letterSpacing:1,marginTop:15,marginBottom:8},menu:{minHeight:61,borderBottomWidth:1,paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:11},menuIcon:{width:37,height:37,borderRadius:12,alignItems:'center',justifyContent:'center'},languageBox:{borderWidth:1,borderRadius:18,padding:15},languageRow:{height:52,borderBottomWidth:1,flexDirection:'row',alignItems:'center',gap:12},radio:{width:20,height:20,borderRadius:10,borderWidth:2,alignItems:'center',justifyContent:'center'},radioDot:{width:10,height:10,borderRadius:5},back:{height:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},backTitle:{fontSize:19,fontWeight:'900'},search:{height:53,borderWidth:1,borderRadius:17,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},notifCard:{flexDirection:'row',gap:12,borderRadius:16,borderWidth:1,padding:14,marginBottom:10},notifIconWrap:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},notifTitle:{fontSize:14,fontWeight:'800',flex:1,marginRight:8},notifBody:{fontSize:12,marginTop:4,lineHeight:18},notifTime:{fontSize:10,fontWeight:'700',marginTop:6},notifLiveDot:{width:8,height:8,borderRadius:4},notifLink:{flexDirection:'row',alignItems:'center',gap:3,borderWidth:1,borderRadius:6,paddingHorizontal:6,paddingVertical:2},badge:{position:'absolute',top:-5,right:-7,minWidth:18,height:18,borderRadius:9,alignItems:'center',justifyContent:'center',paddingHorizontal:4},badgeText:{color:'#fff',fontSize:10,fontWeight:'900'},detailTop:{height:245,borderRadius:21,alignItems:'center',justifyContent:'center',marginBottom:20},detailTitle:{fontSize:27,fontWeight:'900',lineHeight:35},meta:{flexDirection:'row',gap:17,marginTop:10},actions:{flexDirection:'row',justifyContent:'space-around',marginVertical:20},action:{width:43,height:43,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center'},button:{height:54,borderRadius:16,backgroundColor:'#087A63',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:14},buttonText:{color:'#fff',fontWeight:'900',fontSize:15},chapter:{minHeight:66,borderBottomWidth:1,flexDirection:'row',alignItems:'center',gap:12},number:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},comment:{height:56,borderWidth:1,borderRadius:16,marginTop:20,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:15},readerHead:{minHeight:68,paddingHorizontal:18,borderBottomWidth:1,flexDirection:'row',alignItems:'center'},readerBody:{padding:28,paddingTop:45,paddingBottom:110},readerTitle:{fontSize:28,fontWeight:'900',textAlign:'center',marginVertical:16},readerTools:{minHeight:68,borderTopWidth:1,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},writer:{backgroundColor:'#124D43',borderRadius:20,padding:20},writerTitle:{color:'#fff',fontSize:22,fontWeight:'900',marginTop:12},story:{height:180,borderWidth:1,borderRadius:17,padding:15,textAlignVertical:'top',marginVertical:12},empty:{alignItems:'center',justifyContent:'center',paddingVertical:55},profileCard:{borderRadius:22,padding:20,alignItems:'center'},avatarBig:{width:68,height:68,borderRadius:22,alignItems:'center',justifyContent:'center'},profileNameBig:{fontSize:22,fontWeight:'900',marginTop:12},profileBadge:{fontSize:12,color:'#91A39E',marginTop:2},profileStats:{flexDirection:'row',marginTop:18,backgroundColor:'rgba(0,0,0,0.04)',borderRadius:14,paddingVertical:12},profileStat:{flex:1,alignItems:'center',gap:4},profileStatNum:{fontSize:20,fontWeight:'900'},profileStatLabel:{fontSize:10,fontWeight:'700',letterSpacing:0.5},menuGroup:{borderRadius:18,overflow:'hidden',marginBottom:10},menuGroupTitle:{fontSize:11,fontWeight:'900',letterSpacing:0.8,marginBottom:8,marginLeft:4},menuItem:{minHeight:54,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:12},menuIconBig:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},menuSep:{height:StyleSheet.hairlineWidth,marginLeft:62},nameModal:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24},nameModalBox:{width:'100%',borderRadius:22,padding:24},nameModalTitle:{fontSize:18,fontWeight:'900',marginBottom:4},nameModalHint:{fontSize:12,marginBottom:14},nameInput:{height:52,borderWidth:1.5,borderRadius:14,paddingHorizontal:16,fontSize:16,fontWeight:'700'},nameModalBtns:{flexDirection:'row',gap:10,marginTop:16},nameBtn:{flex:1,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},nameBtnText:{fontWeight:'900',fontSize:15},gateIcon:{width:120,height:120,borderRadius:30},gateTop:{},langRow2:{flexDirection:'row',gap:8,marginTop:18,justifyContent:'center'},langBtn2:{paddingHorizontal:18,paddingVertical:10,borderRadius:12,borderWidth:1.5}});
const featStyles=StyleSheet.create({
  card:{height:252,borderRadius:26,padding:18,flexDirection:'column',justifyContent:'space-between',overflow:'hidden'},
  top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',zIndex:2},
  rank:{borderRadius:9,paddingHorizontal:9,paddingVertical:4},
  rankText:{fontSize:11,fontWeight:'900'},
  bm:{width:32,height:32,borderRadius:10,alignItems:'center',justifyContent:'center',borderWidth:1,backgroundColor:'#00000033'},
  row:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:12,zIndex:2},
  left:{flex:1,paddingRight:4},
  tag:{alignSelf:'flex-start',borderRadius:8,paddingHorizontal:9,paddingVertical:3,marginBottom:9},
  tagText:{fontSize:10,fontWeight:'900',letterSpacing:.4},
  title:{color:'#fff',fontSize:21,lineHeight:27,fontWeight:'900'},
  author:{color:'#E1EEEA',fontSize:12,marginTop:4,fontWeight:'600'},
  meta:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:9,marginTop:10},
  metaC:{flexDirection:'row',alignItems:'center',gap:4},
  metaT:{color:'#DCEAE6',fontSize:11,fontWeight:'700'},
  btn:{flexDirection:'row',alignItems:'center',gap:5,borderRadius:10,paddingVertical:7,paddingHorizontal:12,alignSelf:'flex-start',marginTop:12,elevation:3,shadowColor:'#000',shadowOpacity:.22,shadowRadius:7,shadowOffset:{width:0,height:3}},
  btnText:{fontSize:12,fontWeight:'900'},
  coverWrap:{borderRadius:8,elevation:5,shadowColor:'#000',shadowOpacity:.35,shadowRadius:10,shadowOffset:{width:0,height:5}},
  coverImg:{width:118,height:166,borderRadius:10,alignItems:'center',justifyContent:'center',transform:[{rotate:'2deg'}]}
});
