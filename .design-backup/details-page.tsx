// ============================================
// DETAILS PAGE - Save for restore after git
// Includes: Panel (blur+gradient+SVG), Card, Views/Likes row
// ============================================

// DETAILS PANEL (line 912-941):
// <View style={[dStyles.panel,{borderColor:'#00000022'}]}>
//   {b.cover_url?<Image source={{uri:b.cover_url}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,width:'100%',height:'100%'}} blurRadius={30} resizeMode="cover"/>:<View style={{...StyleSheet.absoluteFillObject,backgroundColor:base}}/>}
//   <View style={{...StyleSheet.absoluteFillObject,backgroundColor:'#00000066'}}/>
//   <LinearGradient colors={[base,dark]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
//   <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
//     <Circle cx="90%" cy={-10} r={100} fill={accent+'25'}/>
//     <Ellipse cx="8%" cy={220} rx={120} ry={70} fill={accent+'18'}/>
//     <Circle cx="75%" cy={190} r={55} fill="#ffffff0A"/>
//   </Svg>
//   <View style={dStyles.storyCard}>
//     <View style={dStyles.coverBox}><Cover book={b}/></View>
//     <View style={dStyles.storyInfo}>
//       - Category badge (dStyles.statusBadge)
//       - Title (dStyles.storyTitle)
//       - Author + avatar + chevron
//       - TagRow: rating + chapters + isNew
//     </View>
//   </View>
// </View>

// CARD STYLES (dStyles):
// panel: borderRadius:24, overflow:'hidden', borderWidth:1, marginBottom:16, elevation:5
// storyCard: flexDirection:'row', alignItems:'center', gap:16, padding:16, zIndex:2
// coverBox: borderRadius:14, elevation:6
// statusBadge: alignSelf:'flex-start', flexDirection:'row', gap:5, borderRadius:8, paddingHorizontal:9, paddingVertical:4
// storyTitle: color:'#fff', fontSize:17, lineHeight:22, fontWeight:'900', marginTop:8
// storyAuthor: color:'#E8F1EE', fontSize:12.5, fontWeight:'700', marginTop:5
// tagRow: flexDirection:'row', alignItems:'center', flexWrap:'wrap', gap:7, marginTop:11
// miniTag: flexDirection:'row', alignItems:'center', gap:4, borderRadius:8, paddingHorizontal:8, paddingVertical:4
// miniTagT: color:'#fff', fontSize:10.5, fontWeight:'800'

// LAYOUT ORDER:
// 1. Panel (blur bg + gradient + SVG + card)
// 2. Views/Likes row (outside panel)
// 3. Read/Download buttons
// 4. Chapters list
// 5. Summary

// COVER SIZE: 110x155
// <Cover book={b}/> component renders cover with proper size
