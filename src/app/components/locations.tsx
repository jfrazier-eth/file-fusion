interface Props {}

export function Locations(props: Props) {
  return (
    <div className="flex flex-col h-full bg-base w-32 justify-between border-r border-primary">
      <ul className="menu">
        <li>
          <a>Local</a>
        </li>
        <li>
          <a>Arweave</a>
        </li>
        <li>
          <a>Object store</a>
        </li>
      </ul>

      <div>
        <button className="btn btn-primary btn-sm w-full rounded-none m-0 py-0">
          +
        </button>
      </div>
    </div>
  );
}
