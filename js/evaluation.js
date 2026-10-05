const currentPlayerId =
    Number(localStorage.getItem("currentPlayerId"));

const currentPlayerName =
    localStorage.getItem("currentPlayerName");


document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById("welcomeText")
            .innerText =
            `Hoşgeldin ${currentPlayerName}`;

        loadEvaluationList();

        document
            .getElementById("prepareTeamsBtn")
            .addEventListener(
                "click",
                () => {

                    window.location.href =
                        "teams.html";

                }
            );

    }
);


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

    await checkGlobalCompletion();
}


async function checkGlobalCompletion() {

    const { data: players } =
        await supabaseClient
            .from("players")
            .select("*")
            .order("name");

    const playerCount =
        players.length;

    const expectedVotes =
        playerCount *
        (playerCount - 1);

    const {
        count: currentVotes
    } =
        await supabaseClient
            .from("votes")
            .select("*", {
                count: "exact",
                head: true
            });

    const globalStatus =
        document.getElementById(
            "globalStatus"
        );

    if (
        currentVotes >= expectedVotes
    ) {

        globalStatus.innerHTML = `
            <p style="
                color:green;
                font-weight:bold;
                margin-top:15px;
            ">
                ✅ Tüm değerlendirmeler tamamlandı
            </p>
        `;

        document
            .getElementById(
                "prepareTeamsBtn"
            )
            .style.display =
            "block";

        return;
    }

    let html = `
        <div style="margin-top:15px;">
            <h3>Eksik Değerlendirmeler</h3>
    `;

    for (const player of players) {

        const { count } =
            await supabaseClient
                .from("votes")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq(
                    "voter_id",
                    player.id
                );

        const expected =
            playerCount - 1;

        const missing =
            expected - count;

        if (missing > 0) {

            html += `
                <div>
                    ❌ ${player.name}
                    (${missing} eksik)
                </div>
            `;
        }
    }

    html += "</div>";

    const percent =
        Math.round(
            (
                currentVotes /
                expectedVotes
            ) * 100
        );

    html += `
        <div style="margin-top:15px;">
            Genel Tamamlanma:
            <b>%${percent}</b>
        </div>
    `;

    globalStatus.innerHTML =
        html;

    document
        .getElementById(
            "prepareTeamsBtn"
        )
        .style.display =
        "none";
}