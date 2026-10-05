const currentPlayerId =
    Number(localStorage.getItem("currentPlayerId"));

const targetPlayerId =
    Number(localStorage.getItem("targetPlayerId"));

const targetPlayerName =
    localStorage.getItem("targetPlayerName");

const ratings = {
    condition: 0,
    technique: 0,
    attack: 0,
    defense: 0,
    teamplay: 0
};

document.addEventListener("DOMContentLoaded", async () => {

    document.getElementById(
        "targetPlayerName"
    ).innerText = targetPlayerName;

    createStars("conditionStars", "conditionText", "condition");
    createStars("techniqueStars", "techniqueText", "technique");
    createStars("attackStars", "attackText", "attack");
    createStars("defenseStars", "defenseText", "defense");
    createStars("teamplayStars", "teamplayText", "teamplay");

    await loadExistingVote();

    document
        .getElementById("voteForm")
        .addEventListener("submit", saveVote);

});

function createStars(containerId, textId, key) {

    const container =
        document.getElementById(containerId);

    for (let i = 1; i <= 5; i++) {

        const star =
            document.createElement("span");

        star.innerHTML = "★";

        star.addEventListener("click", () => {

            ratings[key] = i;

            updateStars(containerId, textId, key);

        });

        container.appendChild(star);
    }
}

function updateStars(containerId, textId, key) {

    const stars =
        document.querySelectorAll(
            `#${containerId} span`
        );

    stars.forEach((star, index) => {

        if (index < ratings[key]) {
            star.classList.add("active");
        } else {
            star.classList.remove("active");
        }

    });

    document
        .getElementById(textId)
        .innerText = `${ratings[key]}/5`;
}

async function loadExistingVote() {

    const { data } =
        await supabaseClient
            .from("votes")
            .select("*")
            .eq("voter_id", currentPlayerId)
            .eq("target_id", targetPlayerId)
            .maybeSingle();

    if (!data) return;

    ratings.condition = data.condition_score;
    ratings.technique = data.technique_score;
    ratings.attack = data.attack_score;
    ratings.defense = data.defense_score;
    ratings.teamplay = data.teamplay_score;

    updateStars("conditionStars", "conditionText", "condition");
    updateStars("techniqueStars", "techniqueText", "technique");
    updateStars("attackStars", "attackText", "attack");
    updateStars("defenseStars", "defenseText", "defense");
    updateStars("teamplayStars", "teamplayText", "teamplay");
}

async function saveVote(event) {

    event.preventDefault();

    if (
        ratings.condition === 0 ||
        ratings.technique === 0 ||
        ratings.attack === 0 ||
        ratings.defense === 0 ||
        ratings.teamplay === 0
    ) {
        alert("Lütfen tüm alanları puanlayın.");
        return;
    }

    const payload = {

        voter_id: currentPlayerId,
        target_id: targetPlayerId,

        condition_score: ratings.condition,
        technique_score: ratings.technique,
        attack_score: ratings.attack,
        defense_score: ratings.defense,
        teamplay_score: ratings.teamplay

    };

    const { error } =
        await supabaseClient
            .from("votes")
            .upsert(payload, {
                onConflict: "voter_id,target_id"
            });

    if (error) {

        console.error(error);

        alert("Kayıt hatası oluştu.");

        return;
    }

    window.location.href = "evaluation.html";
}