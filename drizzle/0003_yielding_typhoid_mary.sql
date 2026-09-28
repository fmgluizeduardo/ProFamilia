CREATE TABLE "erros_sistema" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referencia" text NOT NULL,
	"codigo" text NOT NULL,
	"mensagem" text,
	"tecnico" text,
	"pilha" text,
	"rota" text,
	"metodo" text,
	"usuario_id" uuid,
	"usuario_nome" text,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erros_sistema" ADD CONSTRAINT "erros_sistema_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "erros_sistema_data_idx" ON "erros_sistema" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "erros_sistema_referencia_idx" ON "erros_sistema" USING btree ("referencia");