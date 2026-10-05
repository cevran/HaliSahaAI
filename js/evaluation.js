const currentPlayerId =
    Number(localStorage.getItem("currentPlayerId"));

const currentPlayerName =
    localStorage.getItem("currentPlayerName");

document
    .getElementById("welcomeText")
    .innerText =
    `Hoşgeldin ${currentPlayerName}`;

async function loadEvaluationList() {

    const playerList =
        document.getElementById("playerList");

    playerList.innerHTML = "";

    const { data: players, error } =
        await supabaseClient
            .from("players")
            .select("*")
            .order("name");

    if (error) {
        console.error(error);
        return;
    }

    let completed = 0;
    let total = 0;

    for (const player of players) {

        if (player.id === currentPlayerId) {
            continue;
        }

        total++;

        const { data: vote } =
            await supabaseClient
                .from("votes")
                .select("id")
                .eq("voter_id", currentPlayerId)
                .eq("target_id", player.id)
                .maybeSingle();

        const row =
            document.createElement("div");

        row.style.padding = "10px";
        row.style.marginBottom = "10px";
        row.style.border = "1px solid #ddd";
        row.style.borderRadius = "8px";
        row.style.cursor = "pointer";

        if (vote) {

            completed++;

            row.innerHTML =
                `✅ ${player.name}`;

        } else {

            row.innerHTML =
                `⬜ ${player.name}`;

        }

        row.addEventListener("click", () => {

            localStorage.setItem(
                "targetPlayerId",
                player.id
            );

            localStorage.setItem(
                "targetPlayerName",
                player.name
            );

            window.location.href =
                "voting.html";
        });

        playerList.appendChild(row);
    }

    const percent =
        total === 0
        ? 100
        : Math.round(
            (completed / total) * 100
          );

    document
        .getElementById("progressText")
        .innerText =
        `${completed}/${total} tamamlandı (%${percent})`;

    if (completed === total) {

        document
            .getElementById("prepareTeamsBtn")
            .style.display =
            "block";
    }
}

document
    .getElementById("prepareTeamsBtn")
    .addEventListener("click", () => {

        window.location.href =
            "teams.html";
    });

document.addEventListener(
    "DOMContentLoaded",
    loadEvaluationList
);