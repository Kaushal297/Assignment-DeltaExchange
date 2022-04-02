import { useEffect, useState } from "react";
import "./App.css";

let socket;
function App() {
	const [apiData, setApiData] = useState([]);
	const [displayMessage, setDisplayMessage] = useState("");

	const [markPrice, setMarkPrice] = useState([]);

	useEffect(() => {
		try {
			fetch("https://api.delta.exchange/v2/products", {
				method: "GET",
			})
				.then(async (response) => {
					const data = await response.json();

					if (!response.ok) {
						const error =
							(data && data.message) || response.statusText;
						return Promise.reject(error);
					} else {
						if (data.success === false) {
							// displaying the error message based on the server side(API)
							setDisplayMessage("Something went wrong ...");
						} else {
							const result = data?.result;

							const finalArray = [];
							const resultData = result.filter(
								(item) =>
									item?.symbol === "BTCUSD" ||
									item?.symbol === "BTCUSDT"
							);

							resultData.forEach((item) => {
								finalArray.push({
									symbol: item?.symbol,
									mark_price: 0,
								});
							});
							console.log(finalArray);
							setApiData(resultData);
							setMarkPrice(finalArray);
						}
					}
				})
				.catch((error) => {
					console.error("There was an error!", error);
				});
		} catch (error) {
			console.error(error);
		}

		const symbols = ["BTCUSD", "BTCUSDT"];

		socket = new WebSocket("wss://production-esocket.delta.exchange");

		socket.onopen = function (e) {
			socket.send(
				JSON.stringify({
					type: "subscribe",
					payload: {
						channels: [
							{
								name: "v2/ticker",
								symbols: symbols,
							},
						],
					},
				})
			);
		};

		socket.onclose = function (event) {
			if (event.wasClean) {
				console.log(
					`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
				);
			} else {
				// e.g. server process killed or network down
				// event.code is usually 1006 in this case
				console.log("[close] Connection died");
			}
		};

		socket.onerror = function (error) {
			console.error(`[error] ${error.message}`);
		};
	}, []);

	useEffect(() => {
		socket.onmessage = function (event) {
			const dataFromServer = JSON.parse(event.data);
			const elementsIndex = markPrice.findIndex(
				(element) => element.symbol === dataFromServer.symbol
			);
			if (elementsIndex !== -1) {
				let newArray = [...markPrice];
				newArray[elementsIndex] = {
					...newArray[elementsIndex],
					mark_price: dataFromServer.mark_price,
				};
				console.log(newArray);
				setMarkPrice(newArray);
			}
		};
	}, [markPrice]);

	// {name: "v2/ticker", symbols: ["BTCUSD", "BTCUSDT"]}
	return (
		<div className='table-container'>
			<table>
				<thead className='capitalize sticky'>
					<tr>
						<td>symbol</td>
						<td>description</td>
						<td>underlying asset</td>
						<td>mark price</td>
					</tr>
				</thead>
				<tbody>
					{apiData.length !== 0 ? (
						apiData.map((item, index) => {
							// console.log(markPrice?.symbol, item?.symbol);
							return (
								<tr key={index}>
									<td>{item?.symbol}</td>
									<td>{item?.description}</td>
									<td>{item?.underlying_asset?.symbol}</td>
									<td>
										{markPrice.map((markPrice) => {
											const valueToBeDisplaed =
												item?.symbol ===
												markPrice.symbol
													? markPrice?.mark_price
													: "";
											return valueToBeDisplaed;
										})}
									</td>
								</tr>
							);
						})
					) : (
						<tr>
							<td colSpan={4}>{displayMessage}</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}

export default App;
