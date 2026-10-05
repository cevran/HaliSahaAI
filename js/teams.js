let allPlayers = [];

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadPlayers();

        document
            .getElementById("generateBtn")
            .addEventListener(
                "click",
                generateTeams
            );
    }
);

async function loadPlayers() {

    const container =
        document.getElementById(
            "playersContainer"
        );

    const { data, error } =
        await supabaseClient
            .from("players")
            .select("*")
            .order("name");

    if (error) {

        console.error(error);

        container.innerHTML =
            "Oyuncular yüklenemedi.";

        return;
    }

    allPlayers = data;

    container.innerHTML = "";

    data.forEach(player => {

        const div =
            document.createElement("div");

        div.className =
            "player-item";

        div.innerHTML = `
            <input
                type="checkbox"
                value="${player.id}"
                id="player_${player.id}">
            <label
                for="player_${player.id}">
                ${player.name}
            </label>
        `;

        container.appendChild(div);

    });
}

async function generateTeams() {

    const message =
        document.getElementById(
            "validationMessage"
        );

    message.innerHTML = "";

    const selectedIds =
        Array.from(
            document.querySelectorAll(
                'input[type="checkbox"\]:checked'
            )
        ).map(
            x => Number(x.value)
        );

    if (selectedIds.length < 6) {

        message.innerHTML =
            `<div class="warning">
                En az 6 oyuncu seçmelisiniz.
            </div>`;

        return;
    }

    if (selectedIds.length > 14) {

        message.innerHTML =
            `<div class="warning">
                En fazla 14 oyuncu seçebilirsiniz.
            </div>`;

        return;
    }

    if (selectedIds.length % 2 !== 0) {

        message.innerHTML =
            `<div class="warning">
                Oyuncu sayısı çift olmalıdır.
            </div>`;

        return;
    }

    const players =
        await buildPlayerStats(
            selectedIds
        );

    const alt1 =
        buildAlternativeOne(players);

    const alt2 =
        buildAlternativeTwo(players);

    renderTeams(
        "alternative1",
        alt1.teamA,
        alt1.teamB
    );

    renderTeams(
        "alternative2",
        alt2.teamA,
        alt2.teamB
    );

    document
        .getElementById(
            "resultsSection"
        )
        .classList.remove(
            "hidden"
        );
}

async function buildPlayerStats(ids) {

    const result = [];

    for (const id of ids) {

        const player =
            allPlayers.find(
                x => x.id === id
            );

        const { data: votes } =
            await supabaseClient
                .from("votes")
                .select("*")
                .eq(
                    "target_id",
                    id
                );

        const avg = field => {

            if (!votes ||
                votes.length === 0) {

                return 3;
            }

            return votes.reduce(
                (a, b) =>
                a + b[field],
                0
            ) / votes.length;
        };

        const condition =
            avg("condition_score");

        const technique =
            avg("technique_score");

        const attack =
            avg("attack_score");

        const defense =
            avg("defense_score");

        const teamplay =
            avg("teamplay_score");

        const power =

            (condition * 1.0) +
            (technique * 1.2) +
            (attack * 1.1) +
            (defense * 1.1) +
            (teamplay * 0.8);

        result.push({

            id,
            name: player.name,

            condition,
            technique,
            attack,
            defense,
            teamplay,

            power

        });

    }

    return result;
}

function buildAlternativeOne(players) {

    const sorted =
        [...players]
        .sort(
            (a, b) =>
            b.power - a.power
        );

    const teamA = [];
    const teamB = [];

    sorted.forEach(
        (player, index) => {

            if (
                index % 4 === 0 ||
                index % 4 === 3
            ) {

                teamA.push(player);

            } else {

                teamB.push(player);

            }

        }
    );

    return { teamA, teamB };
}

function buildAlternativeTwo(players) {

    const sorted =
        [...players]
        .sort(
            (a, b) =>
            b.power - a.power
        );

    const teamA = [];
    const teamB = [];

    sorted.forEach(
        (player, index) => {

            if (
                index % 2 === 0
            ) {

                teamA.push(player);

            } else {

                teamB.push(player);

            }

        }
    );

    return { teamA, teamB };
}

function teamStats(team) {

    const total = key =>
        team.reduce(
            (a, b) =>
            a + b[key],
            0
        );

    return {

        power:
            total("power"),

        condition:
            total("condition"),

        technique:
            total("technique"),

        attack:
            total("attack"),

        defense:
            total("defense"),

        teamplay:
            total("teamplay")

    };
}

function renderTeams(
    containerId,
    teamA,
    teamB
) {

    const a =
        teamStats(teamA);

    const b =
        teamStats(teamB);

    const diff = Math.abs(
        a.power -
        b.power
    );

    const avg =
        (a.power +
         b.power) / 2;

    const percent =
        (
            diff /
            avg
        ) * 100;

    let comment =
        "✅ Çok Dengeli";

    if (
        percent > 3
    ) {

        comment =
            "⚠ Dengeli";
    }

    if (
        percent > 7
    ) {

        comment =
            "❌ Dengesiz";
    }

    document
        .getElementById(
            containerId
        )
        .innerHTML = `

<h3>Takım A</h3>

${teamA.map(
    p => p.name
).join("<br>")}

<hr>

Toplam Güç:
${a.power.toFixed(1)}

<br>
Teknik:
${a.technique.toFixed(1)}

<br>
Hücum:
${a.attack.toFixed(1)}

<br>
Savunma:
${a.defense.toFixed(1)}

<br>
Kondisyon:
${a.condition.toFixed(1)}

<br>
Takım Oyunu:
${a.teamplay.toFixed(1)}

<hr>

<h3>Takım B</h3>

${teamB.map(
    p => p.name
).join("<br>")}

<hr>

Toplam Güç:
${b.power.toFixed(1)}

<br>
Teknik:
${b.technique.toFixed(1)}

<br>
Hücum:
${b.attack.toFixed(1)}

<br>
Savunma:
${b.defense.toFixed(1)}

<br>
Kondisyon:
${b.condition.toFixed(1)}

<br>
Takım Oyunu:
${b.teamplay.toFixed(1)}

<hr>

<b>
Fark:
%${percent.toFixed(1)}
</b>

<br><br>

${comment}

`;
}