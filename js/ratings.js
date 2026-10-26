const ratingsContainer =
    document.getElementById(
        "ratingsContainer"
    );

const searchPlayer =
    document.getElementById(
        "searchPlayer"
    );

let allRatings = [];

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadRatings();

        document
            .getElementById(
                "backBtn"
            )
            .addEventListener(
                "click",
                () => {

                    window.location.href =
                        "evaluation.html";

                }
            );

        searchPlayer.addEventListener(
            "input",
            filterPlayers
        );

    }
);

async function loadRatings() {

    try {

        ratingsContainer.innerHTML =
            `
            <div class="card">
                Oyuncular yükleniyor...
            </div>
            `;

        const {
            data: players,
            error: playersError
        } =
        await supabaseClient
            .from("players")
            .select("*")
            .order(
                "name"
            );

        if (playersError) {

            throw playersError;

        }

        const {
            data: votes,
            error: votesError
        } =
        await supabaseClient
            .from("votes")
            .select("*");

        if (votesError) {

            throw votesError;

        }

        const result = [];

        for (
            const player
            of players
        ) {

            const playerVotes =
                votes.filter(
                    v =>
                        v.target_id ===
                        player.id
                );

            const avg = field => {

                if (
                    playerVotes.length === 0
                ) {

                    return 3;

                }

                return (
                    playerVotes.reduce(
                        (a, b) =>
                            a +
                            Number(
                                b[field]
                            ),
                        0
                    )
                    /
                    playerVotes.length
                );

            };

            const condition =
                avg(
                    "condition_score"
                );

            const technique =
                avg(
                    "technique_score"
                );

            const attack =
                avg(
                    "attack_score"
                );

            const defense =
                avg(
                    "defense_score"
                );

            const teamplay =
                avg(
                    "teamplay_score"
                );

            const power =

                (condition * 1.0) +

                (technique * 1.2) +

                (attack * 1.1) +

                (defense * 1.1) +

                (teamplay * 0.8);

            const attackPower =

                (attack * 0.7) +

                (technique * 0.3);

            const defensePower =

                (defense * 0.7) +

                (condition * 0.3);

            const midfieldPower =

                (teamplay * 0.4) +

                (technique * 0.3) +

                (condition * 0.3);

            let role =
                "🎯 Oyun Kurucu";

            const maxPower =
                Math.max(
                    attackPower,
                    defensePower,
                    midfieldPower
                );

            if (
                maxPower ===
                attackPower
            ) {

                role =
                    "⚔️ Hücum Uzmanı";

            }
            else if (
                maxPower ===
                defensePower
            ) {

                role =
                    "🛡️ Defans Uzmanı";

            }

            result.push({

                id:
                    player.id,

                name:
                    player.name,

                condition,

                technique,

                attack,

                defense,

                teamplay,

                power,

                role,

                voteCount:
                    playerVotes.length

            });

        }

        result.sort(
            (a, b) =>
                b.power -
                a.power
        );

        allRatings =
            result;

        renderRatings(
            allRatings
        );

    }
    catch (error) {

        console.error(
            error
        );

        ratingsContainer.innerHTML =
            `
            <div class="card">
                Veriler yüklenemedi.
            </div>
            `;

    }

}

function filterPlayers() {

    const keyword =
        searchPlayer.value
        .trim()
        .toLowerCase();

    const filtered =
        allRatings.filter(
            p =>
                p.name
                .toLowerCase()
                .includes(
                    keyword
                )
        );

    renderRatings(
        filtered
    );

}

function getRank(
    index
) {

    if (
        index === 0
    ) {

        return "🥇";

    }

    if (
        index === 1
    ) {

        return "🥈";

    }

    if (
        index === 2
    ) {

        return "🥉";

    }

    return `#${index + 1}`;

}

function getBadge(
    power
) {

    if (
        power >= 42
    ) {

        return {
            text:
                "🏆 Elit Oyuncu",
            className:
                "badge-elite"
        };

    }

    if (
        power >= 38
    ) {

        return {
            text:
                "⭐ Güçlü Oyuncu",
            className:
                "badge-strong"
        };

    }

    if (
        power >= 34
    ) {

        return {
            text:
                "👍 Ortalama Üzeri",
            className:
                "badge-average"
        };

    }

    return {
        text:
            "📈 Gelişime Açık",
        className:
            "badge-low"
    };

}

function renderRatings(
    players
) {

    ratingsContainer.innerHTML =
        "";

    if (
        players.length === 0
    ) {

        ratingsContainer.innerHTML =
            `
            <div class="card">
                Oyuncu bulunamadı.
            </div>
            `;

        return;

    }

    players.forEach(
        (
            player,
            index
        ) => {

            const badge =
                getBadge(
                    player.power
                );

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "rating-card";

            card.innerHTML =
                `

                <div class="rating-header">

                    <div>

                        <div class="rating-rank">
                            ${getRank(index)}
                        </div>

                        <div class="rating-name">
                            ${player.name}
                        </div>

                    </div>

                    <div class="rating-power">

                        <div class="power-label">
                            Güç Skoru
                        </div>

                        <div class="power-value">
                            ${player.power.toFixed(1)}
                        </div>

                    </div>

                </div>

                <div class="rating-badge ${badge.className}">
                    ${badge.text}
                </div>

                <br>

                <div class="player-role">
                    ${player.role}
                </div>

                <div class="rating-divider"></div>

                <div class="stat-row">
                    <span>🏃 Kondisyon</span>
                    <span>
                        ${player.condition.toFixed(1)}
                    </span>
                </div>

                <div class="stat-row">
                    <span>🛡️ Defans</span>
                    <span>
                        ${player.defense.toFixed(1)}
                    </span>
                </div>

                <div class="stat-row">
                    <span>⚔️ Hücum</span>
                    <span>
                        ${player.attack.toFixed(1)}
                    </span>
                </div>

                <div class="stat-row">
                    <span>🎯 Teknik</span>
                    <span>
                        ${player.technique.toFixed(1)}
                    </span>
                </div>

                <div class="stat-row">
                    <span>🤝 Takım Oyunu</span>
                    <span>
                        ${player.teamplay.toFixed(1)}
                    </span>
                </div>

                <div class="rating-divider"></div>

                <div class="vote-count">

                    🗳️
                    ${player.voteCount}
                    değerlendirme

                </div>

                `;

            ratingsContainer.appendChild(
                card
            );

        }
    );

}