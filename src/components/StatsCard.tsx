interface Props {

  title: string;

  value: string;
}

function StatsCard({
  title,
  value,
}: Props) {

  return (

    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white transition duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">

      <h2 className="mb-3 text-slate-400">

        {title}

      </h2>

      <p className="text-4xl font-bold text-cyan-400">

        {value}

      </p>

    </div>
  );
}

export default StatsCard;