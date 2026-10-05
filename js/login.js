async function loadPlayers() {

    const select = document.getElementById("playerSelect");

    const { data, error } = await supabaseClient
        .from("players")
        .select("*")
        .order("name");

    if (error) {

        document.getElementById("status").innerHTML =
            "Oyuncular yüklenemedi";

        console.error(error);
        return;
    }

    select.innerHTML = "";

    data.forEach(player => {

        const option = document.createElement("option");

        option.value = player.id;
        option.textContent = player.name;

        select.appendChild(option);

    });
}

document.addEventListener("DOMContentLoaded", () => {

    loadPlayers();

    document
        .getElementById("continueBtn")
        .addEventListener("click", () => {

            const select =
                document.getElementById("playerSelect");

            localStorage.setItem(
                "currentPlayerId",
                select.value
            );

            localStorage.setItem(
                "currentPlayerName",
                select.options[select.selectedIndex].text
            );

            window.location.href = "voting.html";
            
        });

});