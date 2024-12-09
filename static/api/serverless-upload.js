import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
    const url = 'https://min-api.cryptocompare.com/data/v2/histominute';
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    const difference = now - midnight;
    const minutesPassed = Math.floor(difference / 60000);

    const queryParams = new URLSearchParams({
        fsym: 'BTC',
        tsym: 'EUR',
        limit: minutesPassed,
        limit: 250,
    });

    const bitcoinPricesArray = [];

    try {
        const response = await fetch(`${url}?${queryParams}`);
        const data = await response.json();

        if (data.Response === 'Success') {
            const bitcoinData = data.Data.Data;

            for (const minute of bitcoinData) {
                const unixTimestampOriginal = minute.time;
                const price = minute.close;
                /*      const lastPrice = bitcoinPricesArray[bitcoinPricesArray.length - 1][0];
     
                     let percentageChange;
     
                     percentageChange = ((price - lastPrice) / lastPrice) * 1000000;
     
                     bitcoinPricesArray.push([price, unixTimestampOriginal, percentageChange]); */

                bitcoinPricesArray.push([price, unixTimestampOriginal]);
            }

            console.log(bitcoinPricesArray);

            // Convert JSON object to string
            const dataString = JSON.stringify(bitcoinPricesArray);


            //const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-'); // Example: '2023-01-01T00-00'
            //const fileName = `${timestamp}.json`; // Example: '2023-01-01T00-00.json'



            /* const berlinTime = new Date().toLocaleString("de-DE", {
                timeZone: "Europe/Berlin",
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                //second: '2-digit'
            }).replace(/\./g, '-').replace(' ', 'T').replace(':', '-'); // Example: '2023-01-01T00-00'
            const fileName = `${berlinTime}`;  */

            /*  const berlinTime = new Date().toLocaleString("en-US", {
                 timeZone: "Europe/Berlin",
                 year: 'numeric',
                 month: '2-digit',
                 day: '2-digit',
                 hour: '2-digit',
                 minute: '2-digit',
             }).split(',')[0].replace(/\//g, '-'); // Example: '10-27-2024'
 
             const [day, month, year, hour, minute] = berlinTime.split('-');
             const formattedDate = `${year}-${month}-${day}--${hour}-${minute}`; 
 
             const fileName = `${formattedDate}`; */

            const berlinTime = new Date().toLocaleString("en-US", {
                timeZone: "Europe/Berlin",
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }).replace(/\//g, '-').replace(',', ''); // Example: '10-27-2024 12:34'

            const [date, time] = berlinTime.split(' '); // Splits into '10-27-2024' and '12:34'
            const [month, day, year] = date.split('-');
            const [hour, minute] = time.split(':');
            //const formattedDate = `${year}.${month}.${day}-${hour}:${minute}`;
            const formattedDate = `${year}.${month}.${day}`;

            const fileName = `${formattedDate}`;

            // Upload JSON data to Supabase storage
            const { data: supabaseData, error: supabaseError } = await supabase.storage
                .from('bitcoinprice-bucket')
                .upload(fileName, Buffer.from(dataString), {
                    contentType: 'application/json'
                });

            if (supabaseError) {
                console.error('Error uploading file:', supabaseError);
                return res.status(500).json({ message: 'Error uploading file', error: supabaseError.message });
            } else {
                console.log('File uploaded successfully:', supabaseData);
                return res.status(200).json({ message: 'File uploaded successfully', data: supabaseData });
            }
        } else {
            return res.status(500).json({ message: 'Error', error: data.Response });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}