export default function QuickNavigation() {
  return <nav className="workspace-quick-nav" style={{ order: 2 }} aria-label="TestLab sections">
    <span>Jump to</span>
    <a href="#learn"><b>1</b> Learn</a>
    <a href="#playground"><b>2</b> Practice</a>
    <a href="#automation"><b>3</b> Automate</a>
    <a href="#assertions"><b>4</b> Results</a>
  </nav>;
}
