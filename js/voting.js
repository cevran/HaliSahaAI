const currentPlayerId=Number(localStorage.getItem("currentPlayerId"));
let currentTarget=null;
async function loadNextPlayer(){
 const {data:players,error}=await supabaseClient.from("players").select("*").order("name");
 if(error){console.error(error);return;}
 const otherPlayers=players.filter(p=>p.id!==currentPlayerId);
 for(const player of otherPlayers){
  const {data:existingVote}=await supabaseClient.from("votes").select("id").eq("voter_id",currentPlayerId).eq("target_id",player.id).maybeSingle();
  if(!existingVote){currentTarget=player;document.getElementById("playerName").innerText=player.name;return;}
 }
 alert("Tüm değerlendirmeler tamamlandı");
}
async function saveVote(event){
 event.preventDefault();
 const payload={voter_id:currentPlayerId,target_id:currentTarget.id,condition_score:Number(condition.value),technique_score:Number(technique.value),attack_score:Number(attack.value),defense_score:Number(defense.value),teamplay_score:Number(teamplay.value)};
 const {error}=await supabaseClient.from("votes").upsert(payload,{onConflict:'voter_id,target_id'});
 if(error){console.error(error);status.innerText='Kayıt hatası';return;}
 voteForm.reset();
 await loadNextPlayer();
}
document.addEventListener('DOMContentLoaded',async()=>{await loadNextPlayer();voteForm.addEventListener('submit',saveVote);});