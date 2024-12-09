import { createClient } from "@supabase/supabase-js";

import { gsap } from "gsap";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const axios = require("axios");

const priceTag = document.querySelector("#priceTag");

const canvas = document.getElementById("canvasTag");

const ctx = setupCanvas(canvas);

let green = "#00d457";
let red = "#FF0000";
let neutral = "#d8e7e9";
let backgroundColor = "#808080";

let bitcoinPricesArray = [];

let lineColor = "#FFFFFF";

const canvasLoader = document.getElementById("loading-canvas");
canvasLoader.style.opacity = 1;

async function getBitcoinPricePerMinute() {
    const url = "https://min-api.cryptocompare.com/data/v2/histominute";

    const now = new Date();

    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    const noon = new Date();
    noon.setHours(12, 0, 0, 0);

    const h14 = new Date();
    h14.setHours(13, 0, 0, 0);

    const difference = now - midnight;

    const minutesPassed = Math.floor(difference / 60000);
    const fiveMinutesPassed = Math.floor(difference / 300000);

    const params = {
        fsym: "BTC",
        tsym: "EUR",

        limit: 250,
    };

    try {
        const response = await axios.get(url, { params });
        const data = response.data;

        if (data.Response === "Success") {
            bitcoinPricesArray = [];

            const bitcoinData = data.Data.Data;

            let percentageChange100000;

            for (const minute of bitcoinData) {
                const unixTimestampOriginal = minute.time;
                const price = minute.close;

                const unixTimestamp = modifyUnixTimestamp(unixTimestampOriginal);

                let percentageChange100000;

                if (bitcoinPricesArray.length > 0) {
                    const lastPrice =
                        bitcoinPricesArray[bitcoinPricesArray.length - 1][0];

                    percentageChange100000 = ((price - lastPrice) / lastPrice) * 1000000;

                    lineColor = percentageChange100000 < 0 ? "#FF0000" : "#00d457";

                    bitcoinPricesArray.push([
                        price,
                        unixTimestamp,
                        percentageChange100000,
                    ]);
                } else {
                    bitcoinPricesArray.push([price, unixTimestamp]);
                }

                const currentPrice =
                    bitcoinPricesArray[bitcoinPricesArray.length - 1][0];
                priceTag.innerHTML = currentPrice.toFixed(0) + "€";
            }
        }
    } catch (error) {
        console.log("Error:", error.message);
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

function setAllLines(pricesArray) {
    return new Promise((resolve) => {
        if (isMobile()) {
            ctx.save();
            ctx.translate(ctx.canvas.width, 0);
            ctx.rotate(Math.PI / 2);
        }

        for (let i = 1; i < pricesArray.length; i++) {
            const lastPrice = pricesArray[i - 1][0];
            const currentPrice = pricesArray[i][0];

            const lineColor = currentPrice < lastPrice ? red : green;

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

let isPainting = false;

const switchButton = document.querySelector("#switch");
const textColor = document.querySelector("#text");

switchButton.addEventListener("click", () => {
    switchButton.innerHTML = isPainting ? "paint" : "chart";

    isPainting = !isPainting;

    if (isPainting) {
        textColor.style.color = backgroundColor;
    } else if (!isPainting) {
        textColor.style.color = neutral;
    }

    fadeOutBackground(backgroundColor);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setAllLines(bitcoinPricesArray);
});

function fadeOutBackground(color) {
    let background = document.createElement("div");
    background.style.position = "fixed";
    background.style.top = "0";
    background.style.left = "0";
    background.style.width = "100%";
    background.style.height = "100%";
    background.style.background = color;
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

        ctx.fillStyle = color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = color;

        const controlPointX1 = (xStart + xEnd) / 2 + Math.sin(unixTimestamp) * 50;
        const controlPointY1 = (yStart + yEnd) / 2 + Math.cos(unixTimestamp) * 50;

        const controlPointX2 = (xStart + xEnd) / 2 - Math.sin(unixTimestamp) * 50;
        const controlPointY2 = (yStart + yEnd) / 2 - Math.cos(unixTimestamp) * 50;

        ctx.globalAlpha = 0.7 + (unixTimestamp % 1) * 0.3;

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);

        ctx.quadraticCurveTo(controlPointX1, controlPointY1, xEnd, yEnd);

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        if (screen.width > 2000) {
            ctx.font = "8px Arial";
            ctx.shadowBlur = 15;
        } else if (screen.width < 768) {
            ctx.font = "25px Arial";
            ctx.shadowBlur = 0;
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
            ctx.font = "20px Arial";
        } else {
            ctx.font = "1vw Arial";

            ctx.shadowBlur = 1;
        }

        const textOffsetX = 10;
        const textOffsetY = 1;
        ctx.fillText(
            bitcoinPrice.toFixed(0),
            xEnd + textOffsetX,
            yEnd + textOffsetY
        );
    }
}

function drawLastLine() {
    if (bitcoinPricesArray.length < 2) return;

    const lastPrice = bitcoinPricesArray[bitcoinPricesArray.length - 1];
    const secondLastPrice = bitcoinPricesArray[bitcoinPricesArray.length - 2];

    const lineColor = lastPrice[0] < secondLastPrice[0] ? red : green;

    fadeOutBackground(lineColor);

    priceTag.style.opacity = "1";

    setTimeout(function () {
        priceTag.style.opacity = "0";
    }, 250);

    drawRandomLine(ctx, lineColor, lastPrice[1], lastPrice[2], lastPrice[0]);
}

getBitcoinPricePerMinute()
    .then(() => {
        setAllLines(bitcoinPricesArray);
    })
    .then(() => {
        canvasLoader.style.opacity = 0;
    });

function startCountdown() {
    const countdownElement = document.getElementById("countdown");

    function updateCountdown() {
        const now = new Date();

        const seconds = 60 - now.getSeconds();

        countdownElement.innerHTML = seconds;

        if (seconds === 60) {
            getBitcoinPricePerMinute().then(() => {
                drawLastLine();
            });
        }
    }

    updateCountdown();

    setInterval(updateCountdown, 1000);
}

startCountdown();

let isInfoDisplayed = false;

const infoText = document.querySelector("#text");
const infoButton = document.querySelector("#info-button");

infoButton.addEventListener("click", () => {
    isInfoDisplayed = !isInfoDisplayed;
    fadeOutBackground(backgroundColor);

    if (isInfoDisplayed) {
        gsap.to(infoText, { duration: 1, autoAlpha: 1 });

        green = "#d8e7e9";
        red = "#d8e7e9";

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setAllLines(bitcoinPricesArray);
    } else {
        gsap.to(infoText, { duration: 1, autoAlpha: 0 });

        green = "#00d457";
        red = "#FF0000";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setAllLines(bitcoinPricesArray);
    }
});

canvas.addEventListener("click", () => {
    if (isInfoDisplayed) {
        fadeOutBackground(backgroundColor);
        isInfoDisplayed = !isInfoDisplayed;
        infoText.style.visibility = "hidden";
        infoText.style.opacity = 0;
        green = "#00d457";
        red = "#FF0000";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setAllLines(bitcoinPricesArray);
    }
});

document
    .getElementById("archive-link")
    .addEventListener("click", function (event) {
        event.preventDefault();
        const fadeBackground = document.getElementById("fade-background");
        fadeBackground.style.opacity = "1";

        setTimeout(function () {
            window.location.href = "./archive.html";
        }, 500);
    });

window.addEventListener("load", function () {
    const fadeBackground = document.getElementById("fade-background");
    fadeBackground.style.opacity = "0";
});
