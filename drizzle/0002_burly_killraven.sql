CREATE TABLE "veiculos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modelo" text NOT NULL,
	"marca" text,
	"placa" text NOT NULL,
	"ano" integer,
	"cor" text,
	"km_inicial" integer DEFAULT 0 NOT NULL,
	"observacoes" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "veiculos_placa_unique" UNIQUE("placa")
);
--> statement-breakpoint
ALTER TABLE "veiculo_registros" ALTER COLUMN "veiculo" SET DEFAULT 'Kombi · DMN-4326';--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "acesso_ate" date;--> statement-breakpoint
ALTER TABLE "veiculo_registros" ADD COLUMN "veiculo_id" uuid;--> statement-breakpoint
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_criado_por_id_usuarios_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "veiculo_registros" ADD CONSTRAINT "veiculo_registros_veiculo_id_veiculos_id_fk" FOREIGN KEY ("veiculo_id") REFERENCES "public"."veiculos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "veiculo_registros_veiculo_idx" ON "veiculo_registros" USING btree ("veiculo_id");--> statement-breakpoint
-- Migração de dados: cadastra a Kombi do formulário em papel e vincula os percursos já existentes.
INSERT INTO "veiculos" ("modelo", "marca", "placa", "km_inicial", "observacoes")
SELECT 'Kombi', 'Volkswagen', 'DMN4326', COALESCE(MIN("saida_km"), 0),
       'Cadastrado automaticamente a partir do controle diário de saída de veículos.'
FROM "veiculo_registros"
WHERE NOT EXISTS (SELECT 1 FROM "veiculos" WHERE "placa" = 'DMN4326');
--> statement-breakpoint
UPDATE "veiculo_registros"
SET "veiculo_id" = (SELECT "id" FROM "veiculos" WHERE "placa" = 'DMN4326'),
    "veiculo" = 'Kombi · DMN-4326'
WHERE "veiculo_id" IS NULL;
