(() => {
  const $ = s => document.querySelector(s);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const formatPrice = n => new Intl.NumberFormat("en-US").format(Number(n)) + " د.ع";
  const cfg = window.BAZARA_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    cfg.SUPABASE_URL.startsWith("https://") &&
    !cfg.SUPABASE_URL.includes("PASTE_") && !cfg.SUPABASE_ANON_KEY.includes("PASTE_");
  const client = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  let user = null, profile = null, activeCategory = "هەموو", listings = [], authMode = "login";
  const toast = (message, error=false) => { const el=$("#toast"); el.textContent=message; el.classList.remove("hidden"); el.classList.toggle("error",error); window.setTimeout(()=>el.classList.add("hidden"),6500); };
  const statusLabel = s => ({pending:"چاوەڕێی پەسەندکردن",active:"پەسەندکراو",rejected:"ڕەتکراوەتەوە"}[s] || s);
  const isOwner = () => profile?.role === "owner";

  function renderListings() {
    const term=$("#searchInput").value.trim().toLocaleLowerCase();
    const shown=listings.filter(x => (activeCategory==="هەموو" || x.category===activeCategory) &&
      `${x.title} ${x.category} ${x.location} ${x.description||""}`.toLocaleLowerCase().includes(term));
    const grid=$("#listingGrid"); grid.replaceChildren();
    shown.forEach(item=>{
      const card=document.createElement("article"); card.className="listing-card";
      const safeImage = typeof item.image_url==="string" && item.image_url.startsWith("https://") ? item.image_url : "";
      card.innerHTML=`<div class="listing-image">${safeImage?`<img src="${escapeHTML(safeImage)}" alt="${escapeHTML(item.title)}" loading="lazy">`:'<span class="emoji">📦</span>'}<span class="tag">${escapeHTML(item.category)}</span></div>
      <div class="listing-info"><h3>${escapeHTML(item.title)}</h3><div class="price">${formatPrice(item.price)}</div><p class="description">${escapeHTML(item.description||"")}</p>
      <div class="listing-meta"><span>⌖ ${escapeHTML(item.location)}</span><a href="tel:07832775646">پەیوەندی</a></div></div>`;
      grid.appendChild(card);
    });
    $("#listingCount").textContent=`${shown.length} ئیعلان`;
    $("#emptyState").classList.toggle("hidden",shown.length!==0);
  }
  async function loadListings() {
    if(!client){ listings=[]; renderListings(); $("#listingCount").textContent="Supabase ڕێکبخە"; return; }
    const {data,error}=await client.from("listings").select("id,user_id,title,price,category,location,image_url,description,status,created_at").order("created_at",{ascending:false}).limit(300);
    if(error){toast("نەتوانرا ئیعلانەکان باربکرێن: "+error.message,true);return;}
    listings=data||[]; renderListings(); if(user) renderAccount();
  }
  async function loadProfile() {
    if(!client) return;
    const {data:{session}}=await client.auth.getSession();
    user=session?.user||null; profile=null;
    if(user){
      const {data,error}=await client.from("profiles").select("id,email,full_name,role").eq("id",user.id).maybeSingle();
      if(error) toast("کێشە لە خوێندنەوەی هەژمار: "+error.message,true);
      profile=data||null;
    }
    updateNav(); renderAccount();
  }
  function updateNav(){
    $("#loginBtn").textContent=user?(profile?.full_name||user.email):"چوونەژوورەوە";
    $("#postBtn").textContent=user?"+ زیادکردنی ئیعلان":"+ زیادکردنی ئیعلان";
    $("#setupNotice").classList.toggle("hidden",!!client);
  }
  function renderManageRows(items, ownerView){
    const el=ownerView?$("#manageListings"):$("#myListingRows"); el.replaceChildren();
    if(!items.length){el.innerHTML='<p class="muted">هیچ ئیعلانێک نییە.</p>';return;}
    items.forEach(item=>{
      const row=document.createElement("div");row.className="manage-row";
      row.innerHTML=`<div class="manage-copy"><b>${escapeHTML(item.title)}</b><small>${formatPrice(item.price)} · ${escapeHTML(item.location)} · ${escapeHTML(statusLabel(item.status))}</small></div><div class="manage-actions"></div>`;
      const actions=row.querySelector(".manage-actions");
      if(ownerView && item.status!=="active") {const b=document.createElement("button");b.className="small-action";b.textContent="پەسەندکردن";b.onclick=()=>changeStatus(item.id,"active");actions.appendChild(b);}
      if(ownerView && item.status!=="rejected") {const b=document.createElement("button");b.className="small-action warn";b.textContent="ڕەتکردنەوە";b.onclick=()=>changeStatus(item.id,"rejected");actions.appendChild(b);}
      if(ownerView || item.user_id===user?.id) {const b=document.createElement("button");b.className="small-action danger";b.textContent="سڕینەوە";b.onclick=()=>deleteListing(item);actions.appendChild(b);}
      el.appendChild(row);
    });
  }
  function renderAccount(){
    const panel=$("#accountPanel");panel.classList.toggle("hidden",!user);
    if(!user)return;
    $("#accountTitle").textContent=isOwner()?"داشبۆردی Owner":"هەژماری ئەندام";
    $("#accountSummary").textContent=`${user.email} · ڕۆڵ: ${isOwner()?"Owner":"ئەندام"}`;
    $("#ownerTools").classList.toggle("hidden",!isOwner());
    const mine=listings.filter(x=>x.user_id===user.id);
    renderManageRows(mine,false);
    if(isOwner()) renderManageRows(listings,true);
  }
  async function changeStatus(id,status){
    const {error}=await client.from("listings").update({status}).eq("id",id);
    if(error){toast("گۆڕینی دۆخ سەرکەوتوو نەبوو: "+error.message,true);return;}
    toast("دۆخی ئیعلان گۆڕدرا.");await loadListings();
  }
  async function deleteListing(item){
    if(!confirm("دڵنیایت لە سڕینەوەی ئەم ئیعلانە؟"))return;
    if(item.image_path) await client.storage.from("listing-images").remove([item.image_path]);
    const {error}=await client.from("listings").delete().eq("id",item.id);
    if(error){toast("سڕینەوە سەرکەوتوو نەبوو: "+error.message,true);return;}
    toast("ئیعلانەکە سڕایەوە.");await loadListings();
  }
  function openAuth(mode="login"){
    authMode=mode;$("#authTitle").textContent=mode==="login"?"چوونەژوورەوە":"هەژمار دروست بکە";
    $("#authSubmit").textContent=mode==="login"?"چوونەژوورەوە":"تۆمارکردن";
    $("#nameField").classList.toggle("hidden",mode==="login");
    $("#authHelp").textContent=mode==="login"?"بچۆ ژوورەوە بۆ بەڕێوەبردنی ئیعلانەکانت.":"ئیمەیڵ و وشەی نهێنییەکی بەهێز بەکاربهێنە.";
    $("#toggleAuth").textContent=mode==="login"?"هەژمارت نییە؟ هەژمار دروست بکە":"هەژمارت هەیە؟ بچۆ ژوورەوە";
    $("#authDialog").showModal();
  }
  async function submitAuth(e){
    e.preventDefault();if(!client){toast("سەرەتا config.js و Supabase ڕێکبخە.",true);return;}
    const fd=new FormData(e.currentTarget),email=String(fd.get("email")).trim(),password=String(fd.get("password"));
    $("#authSubmit").disabled=true;
    try{
      if(authMode==="signup"){
        const full_name=String(fd.get("full_name")||"").trim();
        const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name}}});
        if(error)throw error;
        if(data.session){toast("هەژمار دروست کرا.");$("#authDialog").close();await loadProfile();await loadListings();}
        else toast("تۆمارکردن سەرکەوتوو بوو. ئیمەیڵەکەت بپشکنە بۆ پشتڕاستکردنەوە.");
      }else{
        const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;
        $("#authDialog").close();e.currentTarget.reset();await loadProfile();await loadListings();toast("بە سەرکەوتوویی چوویتە ژوورەوە.");
      }
    }catch(err){toast(err.message||"هەڵەیەک ڕوویدا.",true);}
    finally{$("#authSubmit").disabled=false;}
  }
  async function submitListing(e){
    e.preventDefault();
    if(!client){toast("سەرەتا Supabase ڕێکبخە.",true);return;}
    if(!user){$("#postDialog").close();openAuth("login");toast("بۆ زیادکردنی ئیعلان پێویستە بچیتە ژوورەوە.");return;}
    const fd=new FormData(e.currentTarget),file=fd.get("image");
    if(!(file instanceof File)||!file.size){toast("تکایە وێنەیەک هەڵبژێرە.",true);return;}
    if(file.size>5*1024*1024){toast("قەبارەی وێنە دەبێت کەمتر لە ٥ مێگابایت بێت.",true);return;}
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){toast("تەنها JPG، PNG یان WEBP پشتیوانی دەکرێت.",true);return;}
    const id=crypto.randomUUID(),ext=({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp"})[file.type],path=`${user.id}/${id}.${ext}`;
    const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;
    try{
      const {error:upErr}=await client.storage.from("listing-images").upload(path,file,{contentType:file.type,upsert:false});
      if(upErr)throw upErr;
      const {data:publicData}=client.storage.from("listing-images").getPublicUrl(path);
      const payload={user_id:user.id,title:String(fd.get("title")).trim(),price:Number(fd.get("price")),category:String(fd.get("category")),location:String(fd.get("location")).trim(),description:String(fd.get("description")||"").trim(),image_url:publicData.publicUrl,image_path:path,status:"pending"};
      const {error}=await client.from("listings").insert(payload);
      if(error){await client.storage.from("listing-images").remove([path]);throw error;}
      $("#postDialog").close();e.currentTarget.reset();toast("ئیعلانەکەت نێردرا بۆ پەسەندکردن.");await loadListings();
    }catch(err){toast("ناردنی ئیعلان سەرکەوتوو نەبوو: "+(err.message||"هەڵە"),true);}
    finally{btn.disabled=false;}
  }
  $("#searchForm").addEventListener("submit",e=>{e.preventDefault();renderListings();});
  $("#searchInput").addEventListener("input",renderListings);
  document.querySelectorAll(".category").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".category").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeCategory=b.dataset.category;renderListings();}));
  $("#loginBtn").addEventListener("click",()=>user?($("#accountPanel").scrollIntoView({behavior:"smooth"})):openAuth("login"));
  $("#postBtn").addEventListener("click",()=>user?$("#postDialog").showModal():openAuth("login"));
  $("#heroPostBtn").addEventListener("click",()=>user?$("#postDialog").showModal():openAuth("login"));
  $("#authForm").addEventListener("submit",submitAuth);
  $("#toggleAuth").addEventListener("click",()=>openAuth(authMode==="login"?"signup":"login"));
  $("#postForm").addEventListener("submit",submitListing);
  $("#signOutBtn").addEventListener("click",async()=>{if(client){await client.auth.signOut();user=null;profile=null;updateNav();renderAccount();await loadListings();toast("چوویتە دەرەوە.");}});
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
  if(client){
    client.auth.onAuthStateChange(()=>{setTimeout(async()=>{await loadProfile();await loadListings();},0);});
    loadProfile().then(loadListings);
  }else{
    $("#setupNotice").classList.remove("hidden");$("#listingGrid").innerHTML='<div class="setup-notice">بۆ بینینی ئیعلانە ڕاستەقینەکان، پڕۆژەی Supabase دروست بکە و فایلەکانی ڕێکبخە.</div>';
    $("#listingCount").textContent="ڕێکخستنی Supabase پێویستە";
  }
})();