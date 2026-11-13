import PageTitle from "~/components/PageTitle";
import Pathfinding from "~/components/pathfinding/Pathfinding";

/** Full-screen, without the site chrome (see App.tsx). */
export default function PathfindingPage() {
	return (
		<>
			<PageTitle
				seoTitle="Pathfinding Visualizer: A*, Dijkstra, BFS — Benjamin Lucier"
				description="Race A*, Dijkstra, BFS and DFS on the same maze, side by side as a grid and as a graph. Draw walls and watch them search."
			/>
			<Pathfinding />
		</>
	);
}
