export function Spinner() {
	return (
		<div>
			<div className="flex p-3 justify-center items-center">
				<img src="./Spinner.gif" alt="spiner" />
			</div>
		</div>
	);
}

export function ErrorCustom() {
	return (
		<div>
			<div className="flex p-3 justify-center items-center transitioned text-[var(--text-red)] text-3xl">
				<h1>Error</h1>
			</div>
		</div>
	);
}

export function NoData() {
	return (
		<div>
			<div className="flex p-3 justify-center items-center transitioned text-[var(--text-red)] text-3xl">
				<h1>No data</h1>
			</div>
		</div>
	);
}

export function CustomMessage({ message }: { message: string }) {
	return (
		<div>
			<div className="flex p-3 justify-center items-center transitioned text-[var(--color-text)] text-2xl">
				<h1>{message}</h1>
			</div>
		</div>
	);
}
