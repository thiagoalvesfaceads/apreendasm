import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Informações que coletamos</h2>
            <p>Coletamos as seguintes informações quando você utiliza nosso serviço:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, endereço de email e senha (armazenada de forma criptografada).</li>
              <li><strong>Dados de uso:</strong> informações sobre seu nicho, público-alvo e preferências de conteúdo que você insere no formulário de geração.</li>
              <li><strong>Conteúdo gerado:</strong> textos, legendas, roteiros e prompts visuais criados pela plataforma.</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador e informações de acesso para segurança.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Como usamos suas informações</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fornecer e melhorar nosso serviço de geração de conteúdo.</li>
              <li>Personalizar a experiência de geração com base no seu nicho e público.</li>
              <li>Processar seus dados através de modelos de inteligência artificial para gerar conteúdo.</li>
              <li>Garantir a segurança da sua conta e prevenir abusos.</li>
              <li>Comunicar atualizações importantes do serviço.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Serviços de terceiros e IA</h2>
            <p>
              Para gerar conteúdo, utilizamos APIs de provedores de inteligência artificial, incluindo
              Google (Gemini), OpenAI (GPT-4o) e Anthropic (Claude). Os dados que você insere no
              formulário de geração são enviados a esses provedores exclusivamente para processar sua
              solicitação de conteúdo.
            </p>
            <p>
              Esses provedores possuem suas próprias políticas de privacidade e práticas de
              tratamento de dados. Recomendamos que você consulte:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Política de Privacidade do Google</a></li>
              <li><a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Política de Privacidade da OpenAI</a></li>
              <li><a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Política de Privacidade da Anthropic</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Armazenamento e segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros com criptografia. Implementamos
              medidas técnicas e organizacionais para proteger suas informações contra acesso não
              autorizado, alteração ou destruição.
            </p>
            <p>
              As imagens geradas são armazenadas temporariamente em nossos servidores e podem ser
              removidas a qualquer momento por solicitação do usuário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Compartilhamento de dados</h2>
            <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Com provedores de IA para processamento de conteúdo (conforme descrito na seção 3).</li>
              <li>Quando exigido por lei ou ordem judicial.</li>
              <li>Para proteger nossos direitos legais ou a segurança de nossos usuários.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Seus direitos</h2>
            <p>Você tem o direito de:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Acessar</strong> os dados pessoais que mantemos sobre você.</li>
              <li><strong>Corrigir</strong> dados incorretos ou desatualizados.</li>
              <li><strong>Excluir</strong> sua conta e todos os dados associados.</li>
              <li><strong>Revogar</strong> o consentimento para o uso dos seus dados a qualquer momento.</li>
              <li><strong>Solicitar portabilidade</strong> dos seus dados em formato legível.</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato conosco pelo email abaixo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Uso de dados do Meta (Facebook/Instagram)</h2>
            <p>
              Se você conectar sua conta do Facebook ou Instagram ao nosso serviço, acessaremos
              apenas as permissões que você autorizar explicitamente. Não armazenamos tokens de
              acesso além do necessário para fornecer o serviço. Você pode revogar o acesso a
              qualquer momento nas configurações de privacidade da sua conta Meta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Alterações nesta política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças
              significativas por email ou através de aviso em nosso site. O uso continuado do serviço
              após alterações constitui aceitação da política atualizada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Contato</h2>
            <p>
              Para dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em contato:
            </p>
            <p className="text-primary">contato@socialmediaapreennda.lovable.app</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Exclusão de dados</h2>
            <p>
              Você pode solicitar a exclusão completa dos seus dados a qualquer momento enviando um
              email para o endereço acima. Processaremos sua solicitação em até 30 dias úteis. Após
              a exclusão, seus dados não poderão ser recuperados.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
