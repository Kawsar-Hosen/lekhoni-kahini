// ============================================
// WRITER PROFILE VIEW - Save for restore after git
// Includes: WriterProfileView (empty state + stats + profile)
// ============================================

// WriterProfileView (line 685-768)
// Features:
// 1. Empty state with soft SVG shapes (Ellipse + curved book outlines)
// 2. Stats divider-separated layout (প্রকাশিত | মোট পাঠ | অনুসারী)
// 3. Follow/Unfollow with spinning animation
// 4. Live follower count + live total reads
// 5. Writer books list

// EMPTY STATE (line 756-765):
// {writerBooks.length===0&&<View style={{alignItems:'center',paddingVertical:40}}>
//   <Svg width={120} height={80} viewBox="0 0 120 80">
//     <Ellipse cx={60} cy={40} rx={50} ry={25} fill={t.primary+'15'}/>
//     <Path d="M30 35 Q60 15 90 35 Q60 55 30 35" fill={t.primary+'10'} stroke={t.primary+'30'} strokeWidth={1}/>
//     <Path d="M40 38 Q60 25 80 38 Q60 51 40 38" fill="none" stroke={t.primary+'20'} strokeWidth={0.8}/>
//     <Circle cx={60} cy={38} r={3} fill={t.primary+'25'}/>
//   </Svg>
//   <T style={{color:t.muted,fontSize:14,fontWeight:'700',marginTop:12}}>এর গল্পসমূহ ০</T>
//   <T style={{color:t.muted,fontSize:12,marginTop:4}}>এই লেখক এখনো কোনো গল্প প্রকাশ করেননি</T>
// </View>}

// STATS (line 734-740):
// <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:16,marginBottom:16,gap:0}}>
//   <View style={{alignItems:'center',flex:1}}><T style={{fontSize:22,fontWeight:'900',color:t.ink}}>{published}</T><T style={{fontSize:10,fontWeight:'700',color:t.muted,marginTop:2}}>প্রকাশিত</T></View>
//   <View style={{width:1, height:36, backgroundColor:t.line}}/>
//   <View style={{alignItems:'center',flex:1}}><T style={{fontSize:22,fontWeight:'900',color:t.ink}}>{liveTotalReads}</T><T style={{fontSize:10,fontWeight:'700',color:t.muted,marginTop:2}}>মোট পাঠ</T></View>
//   <View style={{width:1, height:36, backgroundColor:t.line}}/>
//   <View style={{alignItems:'center',flex:1}}><T style={{fontSize:22,fontWeight:'900',color:t.ink}}>{liveFollowers}</T><T style={{fontSize:10,fontWeight:'700',color:t.muted,marginTop:2}}>অনুসারী</T></View>
// </View>

// LIVE DATA HOOKS:
// - liveTotalReads: fetches from /api/public/books, filters by writer, sums views
// - liveFollowers: fetches from /api/public/writers, finds writer, gets follower_count
