import React, { useState, useMemo } from "react";
import Link from "next/link";
import Head from "next/head";
import axios from "axios";
import downloadjs from 'downloadjs';
import html2canvas from 'html2canvas';
import { Chart } from "../components/ChartComponent";
import ApiKey from "../components/ApiKey";
import Modal from "../components/Modal";
import LoadingDots from "../components/LoadingDots";
import ChatBubble from "../components/ChatBubble";

const CHART_TYPES = [
	'area',
	'bar',
	'line',
	'composed',
	'scatter',
	'pie',
	'radar',
	'radialbar',
	'treemap',
	'funnel',
];

const HomePage = () => {
  const [apiKey, setApiKey] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState("");
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(false);
  const [shouldRenderChart, setShouldRenderChart] = useState(false);

  const chartComponent = useMemo(() => {
		return <Chart data={chartData} chartType={chartType} />;
	}, [chartData, chartType]);
  
  const toggleModal = () => {
    setOpenModal(!openModal);
  }

  const setExample = () => {
     setInputValue("Please draw me a bar chart of 1 banana, 2 apples and an orange");
  }
  
  const handleSubmit = async (event: { preventDefault: () => void }) => {
		event.preventDefault();

		setError(false);
		setIsLoading(true);

		try {
			const chartTypeResponse = await axios.post('/api/get-type', {
				inputData: inputValue,
        apiKey
			});

			if (!CHART_TYPES.includes(chartTypeResponse.data.toLowerCase()))
				return setError(true);

			setChartType(chartTypeResponse.data);

			const libraryPrompt = `Generate a valid JSON in which each element is an object. Strictly using this FORMAT and naming:
[{ "name": "a", "value": 12, "color": "#4285F4" }] for Recharts API. Make sure field name always stays named name. Instead of naming value field value in JSON, name it based on user metric.\n Make sure the format use double quotes and property names are string literals. \n\n${inputValue}\n Provide JSON data only. `;

			const chartDataResponse = await axios.post('/api/parse-graph', {
				prompt: libraryPrompt,
        apiKey
			});

			let parsedData;

			try {
				parsedData = JSON.parse(chartDataResponse.data);
			} catch (error) {
				setError(true);
				console.error('Failed to parse chart data:', error);
			}
			
      setChartData(parsedData);
			setChartType(chartTypeResponse.data);
			setShouldRenderChart(true);
		} catch (error) {
			setError(true);
			console.error('Failed to generate graph data:', error);
		} finally {
			setIsLoading(false);
		}
	};

  const handleCaptureClick = async (selector: string) => {
		const element = document.querySelector<HTMLElement>(selector);
		if (!element) {
			return;
		}
		const canvas = await html2canvas(element);
		const dataURL = canvas.toDataURL('image/png');
		downloadjs(dataURL, 'chart.png', 'image/png');
	};

  return (
    <>
      <Head>
        <title>AI tool to convert text to a beautiful chart</title>
      </Head>
      <div className="flex flex-col px-4 items-center min-h-screen bg-gradient-to-r from-slate-300 to-indigo-50 overflow-x-hidden">
        <header className="max-w-2xl w-full pt-5 pb-5"> 
          <Link href="/">
            <h1 className="font-bold sm:text-3xl flex bg-gradient-to-r from-sky-400 via-violet-600 to-rose-500 bg-clip-text bg-gradient-to-r from-sky-400 via-violet-600 to-rose-500 bg-clip-text text-transparent">
              <img
                src="https://www.svgrepo.com/show/572/lasso.svg"
                width="24"
                height="24"
                className="mr-2 filter brightness-0"
              />
              ChartGPT
            </h1>
            <p className="text-gray-700">
              AI tool to convert text to a beautiful chart
            </p>
          </Link>
        </header>
        <div className="flex flex-col items-center w-full max-w-2xl p-2 rounded-2xl border-gray-300 bg-indigo-50 dark:text-white dark:bg-black dark:border dark:border-white/20">
          <div className="w-full bg-white rounded-2xl">
           
            <ChatBubble show={false} wait={400} showLoading={true}>
            To get started, simply enter a description of your data and the desired single chart type in the input field. Our generator will create the chart for you in just a few seconds!

(e.g 
              <a 
                className="text-blue-700 hover:text-blue-500 underline decoration-dotted underline-offset-2 mx-1"
                href="#" 
                onClick={setExample}>click here</a>) 
            </ChatBubble>

            <ChatBubble show={false} wait={800} showLoading={true}>
              ℹ️ ChartGPT was created with ❤️ by Kate. Follow on
                <a
                  href="https://twitter.com/whoiskatrin"
                  target="_blank"
                  className="text-blue-700 hover:text-blue-500 underline decoration-dotted underline-offset-2 mx-1"
                >Twitter</a> 
                 or ⭐ on  
                <a 
                  href="https://github.com/whoiskatrin/chart-gpt" 
                  target="_blank"
                  className="text-blue-700 hover:text-blue-500 underline decoration-dotted underline-offset-2 mx-1"
                > GitHub </a> 
                for updates!
            </ChatBubble>
            
            <div className="p-2">
            {error ? (  
                <ul className="text-left p-2 mb-2 text-red-500 list-disc list-inside">
                  Something went terribly wrong! Common issues: 
                  <li>👉 Quota issues, try using our own 
                      <a href="#" onClick={toggleModal} className="text-blue-700 hover:text-blue-500 underline decoration-dotted underline-offset-2 mx-1">
                        API Key
                      </a>
                  </li>
                  <li>👉 Try modifying the prompt, make it as clear as possible </li>
                  <li>👉 Make sure you are using the correct format for your chart type</li>
                </ul>
              ) : (
                <div className='w-full max-w-xl p-4'>
                  {isLoading ? (
                    <div className='flex items-center justify-center h-96'>
                      <LoadingDots />
                    </div>
                  ) : (
                    shouldRenderChart && (
                      <>
                        <div
                          className='flex items-center justify-center p-4'
                          style={{
                            width: '100%',
                            height: '400px',
                            overflow: 'auto',
                          }}
                        >
                          {chartComponent}
                        </div>
                        <div className='flex flex-col items-center justify-center p-4'>
                          <button
                            type='button'
                            className='cursor-pointer font-inter font-semibold py-2 px-4 rounded-full blue-button-w-gradient-border text-white text-shadow-0_0_1px_rgba(0,0,0,0.25) shadow-2xl flex flex-row items-center justify-center'
                            onClick={() =>
                              handleCaptureClick(
                                '.recharts-wrapper'
                              )
                            }
                          >
                            💾 Download
                          </button>
                        </div>
                      </>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col w-full max-w-2xl p-2">
            <form onSubmit={handleSubmit} className="flex flex-row w-full gap-2">
              <textarea
                id="input"
                rows={3}
                placeholder=""
                className="appearance-none font-inter basis-4/5 border border-gray-300 dark:border-gray-600 shadow-sm rounded-lg py-2 px-3 bg-custom-gray-bg dark:bg-custom-dark-gray text-gray-700 dark:text-white leading-tight focus:outline-none focus:shadow-outline"
                value={inputValue}
                autoFocus
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button
                type="submit"
                className="cursor-pointer font-inter font-semibold basis-1/5 rounded-xl blue-button-w-gradient-border text-white text-shadow-0_0_1px_rgba(0,0,0,0.25) shadow-2xl"
              >
                🖌️ Draw
              </button>
            </form> 
            {apiKey !== "" ? 
            <div className="text-sm w-full text-align-left pl-2 pt-2">
              🟢 Using custom  
                <a href="#" onClick={toggleModal} className="text-blue-700 hover:text-blue-500 underline decoration-dotted underline-offset-2 mx-1">
                  API Key
                </a>
            </div>
            :
            <div className="text-sm w-full text-align-left pl-2 pt-2">
              Add your API Key 
              <a 
                className="text-blue-700 hover:text-blue-500 underline decoration-dotted underline-offset-2 mx-1"
                href="#" 
                onClick={toggleModal} 
              >here</a> to avoid rate limits 👌
            </div>
          }
          </div>
          <Modal openModal={openModal} title="Set OpenAI API Key" toggleModal={toggleModal}>
            <ApiKey apiKey={apiKey} setApiKey={setApiKey} />
          </Modal>
        </div>

        <footer className="text-center font-inter text-gray-700 text-sm p-4">
          Made with ❤️ using React, Next.js, OpenAI and Tailwind CSS
        </footer>
      </div>
    </>
)};

export default HomePage;
