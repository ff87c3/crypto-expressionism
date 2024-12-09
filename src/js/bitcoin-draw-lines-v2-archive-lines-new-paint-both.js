import { createClient } from "@supabase/supabase-js";

import gsap from "gsap";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const canvas = document.getElementById("canvasTag");
const ctx = setupCanvas(canvas);
let lineColor = "#FFFFFF";

let backgroundColor = "#808080";

let modifiedBitcoinArray = [];

async function fetchFiles() {
    const bucketName = "bitcoinprice-bucket";
    const { data, error } = await supabase.storage.from(bucketName).list();

    if (error) {
        console.error("Error fetching files:", error);
        return;
    }

    let isDrawing = false;

    const liMenu = document.getElementById("archive-dates");

    for (let i = data.length - 1; i >= 0; i--) {
        const file = data[i];
        const li = document.createElement("li");
        li.value = file.name;

        const dateParts = file.name.split(".");
        const day = dateParts[2];
        const monthNames = [
            "jan",
            "feb",
            "mar",
            "apr",
            "may",
            "jun",
            "jul",
            "aug",
            "sep",
            "oct",
            "nov",
            "dec",
        ];
        const month = monthNames[parseInt(dateParts[1]) - 1];
        const year = dateParts[0].slice(2);

        const formattedDate = `${day}.${month}.${year}`;

        li.textContent = formattedDate;

        li.addEventListener("click", async () => {
            if (isDrawing) return;

            const allLiElements = liMenu.getElementsByTagName("li");

            for (let j = 0; j < allLiElements.length; j++) {
                allLiElements[j].classList.remove("hovered");
            }

            li.classList.add("hovered");

            isDrawing = true;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const selectedFileName = file.name;
            const bucketName = "bitcoinprice-bucket";

            try {
                await retrieveAndLogJson(bucketName, selectedFileName);
            } catch (error) {
                console.error(error);
            } finally {
                isDrawing = false;
            }
        });

        liMenu.appendChild(li);

        const lastLi = liMenu.getElementsByTagName("li")[0];
        lastLi.classList.add("hovered");
    }

    const liElements = liMenu.querySelectorAll("li");
    liElements.forEach((li, index) => {
        gsap.to(li, {
            opacity: 0.3,
            duration: 0.5,
            ease: "power1.inOut",
            delay: index * 0.1,
        });
    });

    if (data.length > 0) {
        const lastFile = data[data.length - 1];
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
            await retrieveAndLogJson(bucketName, lastFile.name);
        } catch (error) {
            console.error(error);
        }
    }
}

fetchFiles();

async function retrieveAndLogJson(bucketName, filePath) {
    document.getElementById("loading-canvas").style.opacity = 1;

    const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

    if (error) {
        console.error("Error retrieving file:", error);
        return;
    }

    const fileText = await data.text();

    const rawBitcoinArray = JSON.parse(fileText);

    modifiedBitcoinArray = [];

    let percentageChange;

    for (let i = 0; i < rawBitcoinArray.length; i++) {
        const price = rawBitcoinArray[i][0];
        const unixTimestampOriginal = rawBitcoinArray[i][1];

        const bitcoinPrice = price;
        const unixTimestamp = modifyUnixTimestamp(unixTimestampOriginal);

        if (i > 0) {
            const previousPrice = rawBitcoinArray[i - 1][0];
            percentageChange =
                ((bitcoinPrice - previousPrice) / previousPrice) * 1000000;
        } else {
            percentageChange = 0;
        }

        modifiedBitcoinArray.push([price, unixTimestamp, percentageChange]);
    }

    await setAllLines(modifiedBitcoinArray, ctx);

    document.getElementById("loading-canvas").style.opacity = 0;
}

function modifyUnixTimestamp(timestamp) {
    let strTimestamp = timestamp.toString();
    if (strTimestamp.length !== 10) {
        throw new Error("Timestamp must be a 10-digit number");
    }

    const fibonacci = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];

    let transformedTimestamp = "";
    for (let i = 0; i < strTimestamp.length; i++) {
        let digit = Number(strTimestamp[i]);
        transformedTimestamp += (digit + fibonacci[i]) % 10;
    }

    transformedTimestamp = Number(transformedTimestamp) + 6421357910;

    let adjustedTimestamp = transformedTimestamp % 10000000000;

    return adjustedTimestamp;
}

function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

function setAllLines(pricesArray, ctx) {
    return new Promise((resolve) => {
        if (isMobile()) {
            ctx.save();
            ctx.translate(ctx.canvas.width, 0);
            ctx.rotate(Math.PI / 2);
        }

        for (let i = 1; i < pricesArray.length; i++) {
            const lastPrice = pricesArray[i - 1][0];
            const currentPrice = pricesArray[i][0];
            const lineColor = currentPrice < lastPrice ? "#FF0000" : "#00d457";

            const bitcoinPrice = pricesArray[i][0];
            const unixTimestamp = pricesArray[i][1];
            const percentageChange = pricesArray[i][2];

            drawRandomLine(
                ctx,
                lineColor,
                unixTimestamp,
                percentageChange,
                bitcoinPrice
            );
        }

        if (isMobile()) {
            ctx.restore();
        }

        resolve();
    });
}

function drawRandomLine(ctx, color, unixTimestamp, percentage, bitcoinPrice) {
    const seedXStart = (unixTimestamp % 1000) / 1000;
    const seedYStart = ((unixTimestamp * 2.12455) % 1000) / 1000;
    const seedXEnd = ((unixTimestamp * 3.2874) % 1000) / 1000;
    const seedYEnd = ((unixTimestamp * 10.24585) % 1000) / 1000;

    let xStart, yStart, xEnd, yEnd;

    if (isMobile()) {
        xStart = seedXStart * ctx.canvas.height;
        yStart = seedYStart * ctx.canvas.width;
        xEnd = seedXEnd * ctx.canvas.height;
        yEnd = seedYEnd * ctx.canvas.width;
    } else {
        xStart = seedXStart * ctx.canvas.width;
        yStart = seedYStart * ctx.canvas.height;
        xEnd = seedXEnd * ctx.canvas.width;
        yEnd = seedYEnd * ctx.canvas.height;
    }

    drawLine(
        ctx,
        xStart,
        yStart,
        xEnd,
        yEnd,
        color,
        unixTimestamp,
        percentage,
        bitcoinPrice
    );
}

let isPainting = true;

const switchButton = document.querySelector("#switch");

switchButton.addEventListener("click", () => {
    switchButton.innerHTML = isPainting ? "paint" : "chart";

    isPainting = !isPainting;

    fadeOutBackground();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setAllLines(modifiedBitcoinArray, ctx);
});

function fadeOutBackground() {
    const background = document.createElement("div");
    background.style.position = "fixed";
    background.style.top = "0";
    background.style.left = "0";
    background.style.width = "100%";
    background.style.height = "100%";
    background.style.background = backgroundColor;
    background.style.opacity = "1";
    background.style.transition = "opacity 0.25s";

    document.body.appendChild(background);

    setTimeout(function () {
        background.style.opacity = "0";

        setTimeout(function () {
            background.parentNode.removeChild(background);
        }, 250);
    }, 0);
}

function drawLine(
    ctx,
    xStart,
    yStart,
    xEnd,
    yEnd,
    color,
    unixTimestamp,
    percentage,
    bitcoinPrice
) {
    if (isPainting) {
        let minLineWidth, maxLineWidth;

        if (isMobile()) {
            minLineWidth = 5;
            maxLineWidth = 10;
        } else {
            minLineWidth = 1;
            maxLineWidth = 4;
        }

        const lineWidth =
            minLineWidth + (percentage / 100) * (maxLineWidth - minLineWidth);

        const controlPointX1 = (xStart + xEnd) / 2 + Math.sin(unixTimestamp) * 50;
        const controlPointY1 = (yStart + yEnd) / 2 + Math.cos(unixTimestamp) * 50;

        const controlPointX2 = (xStart + xEnd) / 2 - Math.sin(unixTimestamp) * 50;
        const controlPointY2 = (yStart + yEnd) / 2 - Math.cos(unixTimestamp) * 50;

        ctx.globalAlpha = 0.7 + (unixTimestamp % 1) * 0.3;

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);

        ctx.quadraticCurveTo(controlPointX1, controlPointY1, xEnd, yEnd);

        ctx.fillStyle = color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = color;

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        const fontSize = Math.max(8, Math.min(20, lineWidth * 4));

        if (screen.width > 2000) {
            ctx.font = "8px Arial";
            ctx.shadowBlur = 15;
        } else if (screen.width < 768) {
            ctx.font = "25px Arial";
        } else {
            ctx.font = "1vw Arial";
            ctx.shadowBlur = 15;
        }

        const textOffsetX = 10;
        const textOffsetY = 1;
        ctx.fillText(
            bitcoinPrice.toFixed(0),
            xEnd + textOffsetX,
            yEnd + textOffsetY
        );
    } else if (!isPainting) {
        let lineWidth;

        if (isMobile()) {
            lineWidth = 2;
        } else {
            lineWidth = 1;
        }

        const controlPointX = (xStart + xEnd) / 2;

        const timeBasedRandom = Math.sin(unixTimestamp % 360) * (percentage / 5);

        const controlPointY =
            (yStart + yEnd) / 2 - percentage / 10 + timeBasedRandom;

        const controlPointX1 = (xStart + xEnd) / 2 + Math.sin(unixTimestamp) * 50;
        const controlPointY1 = (yStart + yEnd) / 2 + Math.cos(unixTimestamp) * 50;

        const midPointX = (xStart + xEnd) / 2;
        const midPointY = (yStart + yEnd) / 2;

        ctx.fillStyle = color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = color;

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.quadraticCurveTo(controlPointX1, controlPointY1, xEnd, yEnd);

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        if (screen.width > 2000) {
            ctx.font = "8px Arial";

            ctx.shadowBlur = 0.5;
        } else if (screen.width < 768) {
            ctx.font = "25px Arial";
        } else {
            ctx.font = "1vw Arial";

            ctx.shadowBlur = 1;
        }

        const lastTwoDigits = unixTimestamp % 100;

        const textOffsetX = 10;
        const textOffsetY = 1;
        ctx.fillText(
            bitcoinPrice.toFixed(0),
            xEnd + textOffsetX,
            yEnd + textOffsetY
        );
    }
}

function setupCanvas(canvas) {
    let dpr = window.devicePixelRatio || 1;

    let rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    let ctx = canvas.getContext("2d");

    return ctx;
}

window.addEventListener("load", function () {
    const fadeBackground = document.getElementById("fade-background");
    fadeBackground.style.opacity = "0";
});

document
    .getElementById("live-link")
    .addEventListener("click", function (event) {
        event.preventDefault();
        const fadeBackground = document.getElementById("fade-background");
        fadeBackground.style.opacity = "1";

        setTimeout(function () {
            window.location.href = "./index.html";
        }, 1000);
    });
